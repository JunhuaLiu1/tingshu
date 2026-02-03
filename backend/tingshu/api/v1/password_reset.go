package v1

import (
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"math/big"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

const (
	passwordResetCodeTTL     = 10 * time.Minute
	passwordResetMaxAttempts = 5
)

type passwordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type passwordResetConfirmRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Code     string `json:"code" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type passwordResetEntry struct {
	Code      string
	ExpiresAt time.Time
	Attempts  int
}

var passwordResetStore = struct {
	sync.Mutex
	entries map[string]passwordResetEntry
}{
	entries: map[string]passwordResetEntry{},
}

func RequestPasswordReset(c *gin.Context) {
	var req passwordResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "INVALID_INPUT")
		return
	}

	email := strings.TrimSpace(req.Email)
	var existingEmail string
	err := config.DB.QueryRow("SELECT email FROM profiles WHERE email = ?", email).Scan(&existingEmail)
	if err == sql.ErrNoRows {
		Error(c, 404, "EMAIL_NOT_FOUND")
		return
	}
	if err != nil {
		Error(c, 500, "DATABASE_ERROR")
		return
	}

	code, err := generateSixDigitCode()
	if err != nil {
		Error(c, 500, "CODE_GENERATE_FAILED")
		return
	}

	passwordResetStore.Lock()
	passwordResetStore.entries[email] = passwordResetEntry{
		Code:      code,
		ExpiresAt: time.Now().Add(passwordResetCodeTTL),
	}
	passwordResetStore.Unlock()

	log.Printf("Password reset code for %s: %s", email, code)
	Success(c, gin.H{
		"sent":    true,
		"message": "Password reset code generated.",
	})
}

func ConfirmPasswordReset(c *gin.Context) {
	var req passwordResetConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, 400, "INVALID_INPUT")
		return
	}

	email := strings.TrimSpace(req.Email)
	code := strings.TrimSpace(req.Code)
	if len(code) != 6 {
		Error(c, 400, "CODE_INVALID")
		return
	}

	passwordResetStore.Lock()
	entry, ok := passwordResetStore.entries[email]
	if !ok {
		passwordResetStore.Unlock()
		Error(c, 400, "CODE_INVALID")
		return
	}
	if time.Now().After(entry.ExpiresAt) {
		delete(passwordResetStore.entries, email)
		passwordResetStore.Unlock()
		Error(c, 400, "CODE_EXPIRED")
		return
	}
	if entry.Code != code {
		entry.Attempts++
		if entry.Attempts >= passwordResetMaxAttempts {
			delete(passwordResetStore.entries, email)
		} else {
			passwordResetStore.entries[email] = entry
		}
		passwordResetStore.Unlock()
		Error(c, 400, "CODE_INVALID")
		return
	}
	passwordResetStore.Unlock()

	if !isValidPassword(req.Password) {
		Error(c, 400, "WEAK_PASSWORD")
		return
	}

	passwordHash, err := hashPassword(req.Password)
	if err != nil {
		Error(c, 500, "PASSWORD_HASH_FAILED")
		return
	}

	result, err := config.DB.Exec("UPDATE profiles SET password_hash = ? WHERE email = ?", passwordHash, email)
	if err != nil {
		Error(c, 500, "DATABASE_ERROR")
		return
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		Error(c, 500, "DATABASE_ERROR")
		return
	}
	if rowsAffected == 0 {
		Error(c, 404, "EMAIL_NOT_FOUND")
		return
	}

	passwordResetStore.Lock()
	delete(passwordResetStore.entries, email)
	passwordResetStore.Unlock()

	Success(c, gin.H{
		"updated": true,
	})
}

func generateSixDigitCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}
