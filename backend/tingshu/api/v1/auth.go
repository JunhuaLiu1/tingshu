package v1

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const jwtExpiresInSeconds = 7 * 24 * 3600

var (
	profilesIDModeOnce sync.Once
	profilesIDMode     string
	profilesIDModeErr  error
)

// 请求结构
type RegisterRequest struct {
	UserID   string `json:"user_id" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

// 验证 userID：必须是 7 位数字
func isValidUserID(userID string) bool {
	matched, _ := regexp.MatchString(`^\d{7}$`, userID)
	return matched
}

// 验证密码强度：长度>=8，包含字母+数字+特殊字符
func isValidPassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasLetter, _ := regexp.MatchString(`[a-zA-Z]`, password)
	hasDigit, _ := regexp.MatchString(`\d`, password)
	hasSpecial, _ := regexp.MatchString(`[!@#$%^&*(),.?":{}|<>]`, password)
	return hasLetter && hasDigit && hasSpecial
}

// hashPassword 使用 bcrypt 加密密码
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// checkPassword 验证密码
func checkPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// Register 注册接口
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "INVALID_INPUT")
		return
	}

	// 验证 userID
	if !isValidUserID(req.UserID) {
		Error(c, 400, "INVALID_USER_ID")
		return
	}

	// 验证密码强度
	if !isValidPassword(req.Password) {
		Error(c, 400, "WEAK_PASSWORD")
		return
	}

	// 检查 userID 是否已存在
	var existingID string
	err := config.DB.QueryRow("SELECT user_id FROM profiles WHERE user_id = ?", req.UserID).Scan(&existingID)
	if err == nil {
		Error(c, 409, "USER_ID_EXISTS")
		return
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		Error(c, 500, "DATABASE_ERROR")
		return
	}

	// 检查 email 是否已存在
	var existingEmail string
	err = config.DB.QueryRow("SELECT email FROM profiles WHERE email = ?", req.Email).Scan(&existingEmail)
	if err == nil {
		Error(c, 409, "EMAIL_EXISTS")
		return
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		Error(c, 500, "DATABASE_ERROR")
		return
	}

	// 加密密码
	passwordHash, err := hashPassword(req.Password)
	if err != nil {
		Error(c, 500, "PASSWORD_HASH_FAILED")
		return
	}

	insertMode, err := getProfilesIDMode()
	if err != nil {
		Error(c, 500, "DATABASE_ERROR")
		return
	}

	var id string
	if insertMode == "auto" {
		// id is auto-increment (default schema)
		if _, err := config.DB.Exec(
			"INSERT INTO profiles (user_id, email, password_hash) VALUES (?, ?, ?)",
			req.UserID, req.Email, passwordHash,
		); err != nil {
			Error(c, 500, "PROFILE_CREATE_FAILED")
			return
		}
		if err := config.DB.QueryRow("SELECT id FROM profiles WHERE user_id = ?", req.UserID).Scan(&id); err != nil {
			Error(c, 500, "DATABASE_ERROR")
			return
		}
	} else {
		// id has no default (e.g., UUID/string schema) -> generate one.
		id, err = generateRandomID()
		if err != nil {
			Error(c, 500, "PROFILE_CREATE_FAILED")
			return
		}
		if _, err := config.DB.Exec(
			"INSERT INTO profiles (id, user_id, email, password_hash) VALUES (?, ?, ?, ?)",
			id, req.UserID, req.Email, passwordHash,
		); err != nil {
			Error(c, 500, "PROFILE_CREATE_FAILED")
			return
		}
	}

	token, expiresIn, err := generateJWTToken(id, req.UserID, req.Email)
	if err != nil {
		Error(c, 500, "AUTH_TOKEN_FAILED")
		return
	}

	Success(c, gin.H{
		"user": gin.H{
			"id":      id,
			"user_id": req.UserID,
			"email":   req.Email,
		},
		"session": gin.H{
			"access_token":  token,
			"refresh_token": "",
			"expires_in":    expiresIn,
		},
		"message": "Registration successful.",
	})
}

func getProfilesIDMode() (string, error) {
	profilesIDModeOnce.Do(func() {
		var extra sql.NullString
		err := config.DB.QueryRow(
			"SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'id'",
		).Scan(&extra)
		if err != nil {
			profilesIDModeErr = err
			return
		}
		if extra.Valid && strings.Contains(strings.ToLower(extra.String), "auto_increment") {
			profilesIDMode = "auto"
			return
		}
		profilesIDMode = "manual"
	})
	return profilesIDMode, profilesIDModeErr
}

func generateRandomID() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	// 32-char hex string
	return fmt.Sprintf("%s", hex.EncodeToString(buf)), nil
}

// Login 登录接口
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "INVALID_INPUT")
		return
	}

	var (
		id           int64
		userID       string
		email        string
		passwordHash string
	)

	// 如果 identifier 是 7 位数字，按 user_id 查询
	if isValidUserID(req.Identifier) {
		err := config.DB.QueryRow(
			"SELECT id, user_id, email, password_hash FROM profiles WHERE user_id = ?",
			req.Identifier,
		).Scan(&id, &userID, &email, &passwordHash)
		if err == sql.ErrNoRows {
			Error(c, 404, "USER_ID_NOT_FOUND")
			return
		} else if err != nil {
			Error(c, 500, "DATABASE_ERROR")
			return
		}
	} else {
		// 按 email 查询
		err := config.DB.QueryRow(
			"SELECT id, user_id, email, password_hash FROM profiles WHERE email = ?",
			req.Identifier,
		).Scan(&id, &userID, &email, &passwordHash)
		if err == sql.ErrNoRows {
			Error(c, 404, "EMAIL_NOT_FOUND")
			return
		} else if err != nil {
			Error(c, 500, "DATABASE_ERROR")
			return
		}
	}

	// 验证密码
	if !checkPassword(req.Password, passwordHash) {
		Error(c, 401, "AUTH_FAILED")
		return
	}

	token, expiresIn, err := generateJWTToken(fmt.Sprintf("%d", id), userID, email)
	if err != nil {
		Error(c, 500, "AUTH_TOKEN_FAILED")
		return
	}

	Success(c, gin.H{
		"user": gin.H{
			"id":      id,
			"user_id": userID,
			"email":   email,
		},
		"session": gin.H{
			"access_token":  token,
			"refresh_token": "",
			"expires_in":    expiresIn,
		},
		"message": "Login successful.",
	})
}

func generateJWTToken(profileID string, userID string, email string) (string, int, error) {
	secret := ""
	if config.AppConfig != nil {
		secret = strings.TrimSpace(config.AppConfig.JWTSecret)
	}
	if secret == "" {
		return "", 0, errors.New("JWT_SECRET is empty")
	}

	expiresIn := jwtExpiresInSeconds
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":      profileID,
		"user_id":  userID,
		"email":    email,
		"iat":      now.Unix(),
		"exp":      now.Add(time.Duration(expiresIn) * time.Second).Unix(),
		"iss":      "tingshu-backend",
		"token_ver": 1,
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := t.SignedString([]byte(secret))
	if err != nil {
		return "", 0, err
	}
	return signed, expiresIn, nil
}

// 判断是否为邮箱格式
func isEmail(s string) bool {
	return strings.Contains(s, "@")
}
