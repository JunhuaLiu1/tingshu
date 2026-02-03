package v1

import (
	"database/sql"
	"net/http"
	"strconv"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

// SourceHistory 播放历史（支持外部音源）
type SourceHistory struct {
	ID           uint   `json:"id"`
	UserID       string `json:"user_id"`
	SourceID     string `json:"source_id"`
	BookID       string `json:"book_id"`
	Title        string `json:"title"`
	Author       string `json:"author"`
	CoverURL     string `json:"cover_url"`
	EpisodeID    string `json:"episode_id"`
	EpisodeTitle string `json:"episode_title"`
	Progress     int    `json:"progress"`
	Duration     int    `json:"duration"`
	CreatedAt    int64  `json:"created_at"`
	UpdatedAt    int64  `json:"updated_at"`
}

var ensureSourceHistoriesOnce sync.Once
var ensureSourceHistoriesErr error

func ensureSourceHistoriesSchema(db *sql.DB) error {
	if db == nil {
		return sql.ErrConnDone
	}

	createTableSQL := `
CREATE TABLE IF NOT EXISTS source_histories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  source_id VARCHAR(255) NOT NULL DEFAULT '',
  book_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  author VARCHAR(255) NOT NULL DEFAULT '',
  cover_url TEXT,
  episode_id VARCHAR(255) NOT NULL DEFAULT '',
  episode_title VARCHAR(255) NOT NULL DEFAULT '',
  progress INT NOT NULL DEFAULT 0,
  duration INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_source_book (user_id, source_id, book_id),
  KEY idx_user_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`

	_, err := db.Exec(createTableSQL)
	return err
}

func ensureSourceHistoriesReady(c *gin.Context) bool {
	ensureSourceHistoriesOnce.Do(func() {
		ensureSourceHistoriesErr = ensureSourceHistoriesSchema(config.DB)
	})
	if ensureSourceHistoriesErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "数据库初始化失败: " + ensureSourceHistoriesErr.Error()})
		return false
	}
	return true
}

// SaveHistory 保存播放历史
func SaveHistory(c *gin.Context) {
	if !ensureSourceHistoriesReady(c) {
		return
	}

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

	_, err := config.DB.Exec(
		`INSERT INTO source_histories (
			user_id, source_id, book_id, title, author, cover_url, episode_id, episode_title, progress, duration
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			title = VALUES(title),
			author = VALUES(author),
			cover_url = VALUES(cover_url),
			episode_id = VALUES(episode_id),
			episode_title = VALUES(episode_title),
			progress = VALUES(progress),
			duration = VALUES(duration),
			updated_at = CURRENT_TIMESTAMP`,
		userID,
		req.SourceID,
		req.BookID,
		req.Title,
		req.Author,
		req.CoverURL,
		req.EpisodeID,
		req.EpisodeTitle,
		req.Progress,
		req.Duration,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "保存失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok", "data": gin.H{"saved": true}})
}

// GetHistory 获取播放历史列表
func GetHistory(c *gin.Context) {
	if !ensureSourceHistoriesReady(c) {
		return
	}

	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}
	userID := token

	rows, err := config.DB.Query(
		`SELECT
			id,
			user_id,
			source_id,
			book_id,
			title,
			author,
			IFNULL(cover_url, ''),
			episode_id,
			episode_title,
			progress,
			duration,
			UNIX_TIMESTAMP(created_at),
			UNIX_TIMESTAMP(updated_at)
		FROM source_histories
		WHERE user_id = ?
		ORDER BY updated_at DESC
		LIMIT 50`,
		userID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "查询失败: " + err.Error()})
		return
	}
	defer rows.Close()

	var histories []SourceHistory
	for rows.Next() {
		var h SourceHistory
		if err := rows.Scan(
			&h.ID,
			&h.UserID,
			&h.SourceID,
			&h.BookID,
			&h.Title,
			&h.Author,
			&h.CoverURL,
			&h.EpisodeID,
			&h.EpisodeTitle,
			&h.Progress,
			&h.Duration,
			&h.CreatedAt,
			&h.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "解析失败: " + err.Error()})
			return
		}
		histories = append(histories, h)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "查询失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok", "data": histories})
}

// DeleteHistory 删除单条历史
func DeleteHistory(c *gin.Context) {
	if !ensureSourceHistoriesReady(c) {
		return
	}

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

	result, err := config.DB.Exec("DELETE FROM source_histories WHERE id = ? AND user_id = ?", id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "删除失败: " + err.Error()})
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "message": "未找到记录"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok"})
}

// ClearHistory 清空所有历史
func ClearHistory(c *gin.Context) {
	if !ensureSourceHistoriesReady(c) {
		return
	}

	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"code": 401, "message": "未授权"})
		return
	}
	userID := token

	if _, err := config.DB.Exec("DELETE FROM source_histories WHERE user_id = ?", userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"code": 500, "message": "清空失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "ok"})
}
