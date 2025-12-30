package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type PlaybackProgress struct {
	BookID    string  `json:"book_id"`
	EpisodeID string  `json:"episode_id"`
	Position  float64 `json:"position"`
	Duration  float64 `json:"duration"`
}

// 内存存储（生产环境应使用数据库）
var progressStore = make(map[string]map[string]PlaybackProgress)

func SavePlaybackProgress(c *gin.Context) {
	userID := c.DefaultQuery("user_id", "default")

	var req PlaybackProgress
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.BookID == "" || req.EpisodeID == "" {
		Error(c, http.StatusBadRequest, "book_id and episode_id are required")
		return
	}

	if progressStore[userID] == nil {
		progressStore[userID] = make(map[string]PlaybackProgress)
	}
	key := req.BookID + "_" + req.EpisodeID
	progressStore[userID][key] = req

	Success(c, gin.H{"saved": true})
}

func GetPlaybackProgress(c *gin.Context) {
	userID := c.DefaultQuery("user_id", "default")
	bookID := c.Query("book_id")
	episodeID := c.Query("episode_id")

	if bookID == "" {
		Error(c, http.StatusBadRequest, "book_id is required")
		return
	}

	userProgress := progressStore[userID]
	if userProgress == nil {
		Success(c, gin.H{"progress": nil})
		return
	}

	if episodeID != "" {
		key := bookID + "_" + episodeID
		if p, ok := userProgress[key]; ok {
			Success(c, gin.H{"progress": p})
			return
		}
		Success(c, gin.H{"progress": nil})
		return
	}

	// 返回该书籍所有章节进度
	var results []PlaybackProgress
	for key, p := range userProgress {
		if len(key) > len(bookID) && key[:len(bookID)] == bookID {
			results = append(results, p)
		}
	}
	Success(c, gin.H{"progress": results})
}

func GetUserHistory(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		userID = "default"
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	userProgress := progressStore[userID]
	if userProgress == nil {
		Success(c, gin.H{"history": []PlaybackProgress{}})
		return
	}

	var results []PlaybackProgress
	for _, p := range userProgress {
		results = append(results, p)
		if len(results) >= limit {
			break
		}
	}
	Success(c, gin.H{"history": results})
}
