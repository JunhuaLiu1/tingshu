package v1

import (
	"database/sql"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

// ProfileResponse 用户资料响应结构
type ProfileResponse struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Email     string    `json:"email"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetProfile 获取当前登录用户的资料
func GetProfile(c *gin.Context) {
	// 从 Auth 中间件中获取用户信息
	profileID, exists := c.Get("profile_id")
	if !exists {
		Error(c, 401, "Unauthorized")
		return
	}

	var (
		id        string
		userID    string
		email     string
		avatar    sql.NullString
		createdAt time.Time
		updatedAt sql.NullTime
	)

	err := config.DB.QueryRow(
		"SELECT id, user_id, email, COALESCE(avatar, '') as avatar, created_at, updated_at FROM profiles WHERE id = ?",
		profileID,
	).Scan(&id, &userID, &email, &avatar, &createdAt, &updatedAt)

	if err == sql.ErrNoRows {
		Error(c, 404, "Profile not found")
		return
	}
	if err != nil {
		Error(c, 500, "Database error")
		return
	}

	avatarStr := ""
	if avatar.Valid {
		avatarStr = avatar.String
	}

	updatedAtTime := createdAt
	if updatedAt.Valid {
		updatedAtTime = updatedAt.Time
	}

	Success(c, ProfileResponse{
		ID:        id,
		UserID:    userID,
		Email:     email,
		Avatar:    avatarStr,
		CreatedAt: createdAt,
		UpdatedAt: updatedAtTime,
	})
}

// UpdateProfileRequest 更新资料请求结构
type UpdateProfileRequest struct {
	Avatar string `json:"avatar"`
}

// UpdateProfile 更新用户资料
func UpdateProfile(c *gin.Context) {
	profileID, exists := c.Get("profile_id")
	if !exists {
		Error(c, 401, "Unauthorized")
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "Invalid input")
		return
	}

	// 更新头像
	_, err := config.DB.Exec(
		"UPDATE profiles SET avatar = ?, updated_at = NOW() WHERE id = ?",
		req.Avatar, profileID,
	)
	if err != nil {
		Error(c, 500, "Update failed")
		return
	}

	// 返回更新后的资料
	GetProfile(c)
}
