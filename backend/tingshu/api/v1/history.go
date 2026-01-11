package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/database"
)

// SourceHistory 播放历史（支持外部音源）
type SourceHistory struct {
	ID           uint   `json:"id" gorm:"primarykey"`
	UserID       string `json:"user_id" gorm:"not null;index:idx_user_source_book,unique"`
	SourceID     string `json:"source_id" gorm:"index:idx_user_source_book,unique"`
	BookID       string `json:"book_id" gorm:"not null;index:idx_user_source_book,unique"`
	Title        string `json:"title"`
	Author       string `json:"author"`
	CoverURL     string `json:"cover_url"`
	EpisodeID    string `json:"episode_id"`
	EpisodeTitle string `json:"episode_title"`
	Progress     int    `json:"progress"`
	Duration     int    `json:"duration"`
	CreatedAt    int64  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    int64  `json:"updated_at" gorm:"autoUpdateTime"`
}

func init() {
	// 自动迁移表结构
	db := database.GetDB()
	if db != nil {
		db.AutoMigrate(&SourceHistory{})
	}
}

// SaveHistory 保存播放历史
func SaveHistory(c *gin.Context) {
	var req struct {
		SourceID     string `json:"source_id"`
		BookID       string `json:"book_id" binding:"required"`
		Title        string `json:"title" binding:"required"`
		Author       string `json:"author"`
		CoverURL     string `json:"cover_url"`
		EpisodeID    string `json:"episode_id"`
		EpisodeTitle string `json:"episode_title"`
		Progress     int    `json:"progress"`
		Duration     int    `json:"duration"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "参数错误: " + err.Error()})
		return
	}

	// 从 token 获取用户 ID（简化处理，使用 header 中的 token）
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}
	userID := token // 简化：直接用 token 作为用户标识（实际应解析 JWT）

	db := database.GetDB()

	// 使用 upsert 逻辑：如果存在则更新，否则插入
	history := SourceHistory{
		UserID:       userID,
		SourceID:     req.SourceID,
		BookID:       req.BookID,
		Title:        req.Title,
		Author:       req.Author,
		CoverURL:     req.CoverURL,
		EpisodeID:    req.EpisodeID,
		EpisodeTitle: req.EpisodeTitle,
		Progress:     req.Progress,
		Duration:     req.Duration,
	}

	// 先查找是否存在
	var existing SourceHistory
	result := db.Where("user_id = ? AND source_id = ? AND book_id = ?", userID, req.SourceID, req.BookID).First(&existing)

	if result.Error == nil {
		// 存在则更新
		db.Model(&existing).Updates(map[string]interface{}{
			"title":         req.Title,
			"author":        req.Author,
			"cover_url":     req.CoverURL,
			"episode_id":    req.EpisodeID,
			"episode_title": req.EpisodeTitle,
			"progress":      req.Progress,
			"duration":      req.Duration,
		})
	} else {
		// 不存在则创建
		db.Create(&history)
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok", "data": gin.H{"saved": true}})
}

// GetHistory 获取播放历史列表
func GetHistory(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}
	userID := token

	db := database.GetDB()
	var histories []SourceHistory
	db.Where("user_id = ?", userID).Order("updated_at DESC").Limit(50).Find(&histories)

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok", "data": histories})
}

// DeleteHistory 删除单条历史
func DeleteHistory(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}
	userID := token

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "message": "无效的 ID"})
		return
	}

	db := database.GetDB()
	db.Where("id = ? AND user_id = ?", id, userID).Delete(&SourceHistory{})

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok"})
}

// ClearHistory 清空所有历史
func ClearHistory(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}
	userID := token

	db := database.GetDB()
	db.Where("user_id = ?", userID).Delete(&SourceHistory{})

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok"})
}
