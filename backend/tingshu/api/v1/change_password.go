package v1

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

func ChangePassword(c *gin.Context) {
	profileID, exists := c.Get("profile_id")
	if !exists {
		Error(c, 401, "Unauthorized")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "INVALID_INPUT")
		return
	}

	if !isValidPassword(req.NewPassword) {
		Error(c, 400, "WEAK_PASSWORD")
		return
	}

	var passwordHash string
	if err := config.DB.QueryRow("SELECT password_hash FROM profiles WHERE id = ?", profileID).Scan(&passwordHash); err != nil {
		if err == sql.ErrNoRows {
			Error(c, 404, "PROFILE_NOT_FOUND")
			return
		}
		Error(c, 500, "DATABASE_ERROR")
		return
	}

	if !checkPassword(req.OldPassword, passwordHash) {
		Error(c, 401, "AUTH_FAILED")
		return
	}

	newHash, err := hashPassword(req.NewPassword)
	if err != nil {
		Error(c, 500, "PASSWORD_HASH_FAILED")
		return
	}

	if _, err := config.DB.Exec(
		"UPDATE profiles SET password_hash = ?, updated_at = NOW() WHERE id = ?",
		newHash, profileID,
	); err != nil {
		Error(c, 500, "DATABASE_ERROR")
		return
	}

	Success(c, gin.H{"updated": true})
}
