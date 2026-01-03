package v1

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
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

// Supabase 响应结构
type SupabaseAuthResponse struct {
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	ExpiresIn    int           `json:"expires_in"`
	User         *SupabaseUser `json:"user"`
	// 兼容直接返回 User 对象的情况
	ID    string `json:"id"`
	Email string `json:"email"`
}

type SupabaseUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

type SupabaseError struct {
	Message string `json:"message"`
	Code    string `json:"code"`
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
	err := config.SupabaseDB.QueryRow("SELECT user_id FROM profiles WHERE user_id = $1", req.UserID).Scan(&existingID)
	if err == nil {
		Error(c, 409, "USER_ID_EXISTS")
		return
	}

	// 检查 email 是否已存在
	var existingEmail string
	err = config.SupabaseDB.QueryRow("SELECT email FROM profiles WHERE email = $1", req.Email).Scan(&existingEmail)
	if err == nil {
		Error(c, 409, "EMAIL_EXISTS")
		return
	}

	// 调用 Supabase Auth signUp
	authResp, err := supabaseSignUp(req.Email, req.Password)
	if err != nil {
		Error(c, 500, "AUTH_CREATE_FAILED")
		return
	}

	// 解析 User ID 和 Email
	userID := authResp.ID
	userEmail := authResp.Email
	if authResp.User != nil && authResp.User.ID != "" {
		userID = authResp.User.ID
		userEmail = authResp.User.Email
	}

	if userID == "" {
		fmt.Println("Error: could not parse user ID from response")
		Error(c, 500, "AUTH_RESPONSE_ERROR")
		return
	}

	// 插入 profiles 映射
	_, err = config.SupabaseDB.Exec(
		"INSERT INTO profiles (id, user_id, email) VALUES ($1, $2, $3)",
		userID, req.UserID, req.Email, // 使用 email from request 因为 Supabase 可能返回空
	)
	if err != nil {
		fmt.Printf("Error creating profile: %v\n", err)
		// 回滚：删除 auth user
		supabaseDeleteUser(userID)
		Error(c, 500, "PROFILE_CREATE_FAILED")
		return
	}

	response := gin.H{
		"user": gin.H{
			"id":      userID,
			"user_id": req.UserID,
			"email":   userEmail,
		},
	}

	// 如果有 Token，则返回 Session；否则可能需要邮箱验证
	if authResp.AccessToken != "" {
		response["session"] = gin.H{
			"access_token":  authResp.AccessToken,
			"refresh_token": authResp.RefreshToken,
			"expires_in":    authResp.ExpiresIn,
		}
	} else {
		response["message"] = "Registration successful. Please check your email for verification."
	}

	Success(c, response)
}

// Login 登录接口
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "INVALID_INPUT")
		return
	}

	email := req.Identifier

	// 如果 identifier 是 7 位数字，查询 profiles 获取 email
	if isValidUserID(req.Identifier) {
		err := config.SupabaseDB.QueryRow("SELECT email FROM profiles WHERE user_id = $1", req.Identifier).Scan(&email)
		if err != nil {
			Error(c, 404, "USER_ID_NOT_FOUND")
			return
		}
	}

	// 调用 Supabase Auth signIn
	authResp, err := supabaseSignIn(email, req.Password)
	if err != nil {
		Error(c, 401, "AUTH_FAILED")
		return
	}

	// 获取 userID
	var userID string
	config.SupabaseDB.QueryRow("SELECT user_id FROM profiles WHERE id = $1", authResp.User.ID).Scan(&userID)

	Success(c, gin.H{
		"user": gin.H{
			"id":      authResp.User.ID,
			"user_id": userID,
			"email":   authResp.User.Email,
		},
		"session": gin.H{
			"access_token":  authResp.AccessToken,
			"refresh_token": authResp.RefreshToken,
			"expires_in":    authResp.ExpiresIn,
		},
	})
}

// Supabase Auth API 调用
func supabaseSignUp(email, password string) (*SupabaseAuthResponse, error) {
	url := fmt.Sprintf("%s/auth/v1/signup", config.AppConfig.SupabaseURL)
	body := map[string]string{"email": email, "password": password}
	return callSupabaseAuth(url, body)
}

func supabaseSignIn(email, password string) (*SupabaseAuthResponse, error) {
	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", config.AppConfig.SupabaseURL)
	body := map[string]string{"email": email, "password": password}
	return callSupabaseAuth(url, body)
}

func callSupabaseAuth(url string, body map[string]string) (*SupabaseAuthResponse, error) {
	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", config.AppConfig.SupabaseAnonKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("Supabase response: %s\n", string(respBody))

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("supabase error: %s", string(respBody))
	}

	var authResp SupabaseAuthResponse
	if err := json.Unmarshal(respBody, &authResp); err != nil {
		return nil, err
	}
	return &authResp, nil
}

func supabaseDeleteUser(userID string) error {
	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", config.AppConfig.SupabaseURL, userID)
	req, _ := http.NewRequest("DELETE", url, nil)
	req.Header.Set("apikey", config.AppConfig.SupabaseServiceKey)
	req.Header.Set("Authorization", "Bearer "+config.AppConfig.SupabaseServiceKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

// 判断是否为邮箱格式
func isEmail(s string) bool {
	return strings.Contains(s, "@")
}
