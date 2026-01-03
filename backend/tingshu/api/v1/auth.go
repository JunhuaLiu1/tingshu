package v1

import (
	"database/sql"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
	"golang.org/x/crypto/bcrypt"
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

	// 检查 email 是否已存在
	var existingEmail string
	err = config.DB.QueryRow("SELECT email FROM profiles WHERE email = ?", req.Email).Scan(&existingEmail)
	if err == nil {
		Error(c, 409, "EMAIL_EXISTS")
		return
	}

	// 加密密码
	passwordHash, err := hashPassword(req.Password)
	if err != nil {
		Error(c, 500, "PASSWORD_HASH_FAILED")
		return
	}

	// 插入 profiles
	result, err := config.DB.Exec(
		"INSERT INTO profiles (user_id, email, password_hash) VALUES (?, ?, ?)",
		req.UserID, req.Email, passwordHash,
	)
	if err != nil {
		Error(c, 500, "PROFILE_CREATE_FAILED")
		return
	}

	id, _ := result.LastInsertId()

	Success(c, gin.H{
		"user": gin.H{
			"id":      id,
			"user_id": req.UserID,
			"email":   req.Email,
		},
		"message": "Registration successful.",
	})
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

	// TODO: 可以在此生成 JWT token
	Success(c, gin.H{
		"user": gin.H{
			"id":      id,
			"user_id": userID,
			"email":   email,
		},
		"message": "Login successful.",
	})
}

// 判断是否为邮箱格式
func isEmail(s string) bool {
	return strings.Contains(s, "@")
}
