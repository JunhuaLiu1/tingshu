package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
	"github.com/username/tingshu-backend/tingshu/model"
	"gorm.io/gorm"
)

// GetBooks 获取书籍列表
// @Summary 获取书籍列表
// @Description 获取所有书籍列表，支持分页
// @Tags books
// @Param page query int false "页码" default(1)
// @Param limit query int false "每页数量" default(20)
// @Produce json
// @Success 200 {object} Response{data=[]model.Book}
// @Router /api/v1/books [get]
func GetBooks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var books []model.Book
	var total int64

	config.DB.Find(&books)
	config.DB.Model(&books).Count(&total)

	// 模拟分页
	paginatedBooks := books[offset : offset+limit]

	Response(c, 200, "success", gin.H{
		"data":       paginatedBooks,
		"total":      total,
		"page":       page,
		"page_size":  limit,
		"total_pages": (int(total) + limit - 1) / limit,
	})
}

// GetBookByID 根据ID获取书籍详情
// @Summary 获取书籍详情
// @Description 根据ID获取书籍详细信息
// @Tags books
// @Param id path int true "书籍ID"
// @Produce json
// @Success 200 {object} Response{data=model.Book}
// @Router /api/v1/books/{id} [get]
func GetBookByID(c *gin.Context) {
	id := c.Param("id")
	var book model.Book

	if err := config.DB.First(&book, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			Response(c, 404, "书籍不存在")
			return
		}
		Response(c, 500, "获取书籍详情失败")
		return
	}

	Response(c, 200, "success", gin.H{
		"data": book,
	})
}

// GetBookEpisodes 获取书籍剧集列表
// @Summary 获取书籍剧集
// @Description 获取指定书籍的所有剧集列表
// @Tags episodes
// @Param id path int true "书籍ID"
// @Produce json
// @Success 200 {object} Response{data=[]model.Episode}
// @Router /api/v1/books/{id}/episodes [get]
func GetBookEpisodes(c *gin.Context) {
	bookID := c.Param("id")
	var episodes []model.Episode

	if err := config.DB.Where("book_id = ?", bookID).Find(&episodes).Error; err != nil {
		Response(c, 500, "获取剧集列表失败")
		return
	}

	Response(c, 200, "success", gin.H{
		"data": episodes,
	})
}

// GetCategories 获取分类列表
// @Summary 获取所有分类
// @Description 获取所有可用的书籍分类
// @Tags categories
// @Produce json
// @Success 200 {object} Response{data=[]model.Category}
// @Router /api/v1/categories [get]
func GetCategories(c *gin.Context) {
	var categories []model.Category

	if err := config.DB.Find(&categories).Error; err != nil {
		Response(c, 500, "获取分类列表失败")
		return
	}

	Response(c, 200, "success", gin.H{
		"data": categories,
	})
}

// GetRankings 获取排行榜
// @Summary 获取默认排行榜
// @Description 获取所有平台排行榜数据
// @Tags rankings
// @Produce json
// @Success 200 {object} Response{data=[]model.Ranking}
// @Router /api/v1/rankings [get]
func GetRankings(c *gin.Context) {
	var rankings []model.Ranking

	if err := config.DB.Find(&rankings).Error; err != nil {
		Response(c, 500, "获取排行榜失败")
		return
	}

	Response(c, 200, "success", gin.H{
		"data": rankings,
	})
}

// GetRankingsByPeriod 获取指定时期的排行榜
// @Summary 获取指定时期排行榜
// @Description 获取特定时间段的排行榜（如日榜、周榜、月榜）
// @Tags rankings
// @Param period path string true "时期：daily, weekly, monthly"
// @Produce json
// @Success 200 {object} Response{data=[]model.Ranking}
// @Router /api/v1/rankings/{period} [get]
func GetRankingsByPeriod(c *gin.Context) {
	period := c.Param("period")
	var rankings []model.Ranking

	if err := config.DB.Where("period = ?", period).Find(&rankings).Error; err != nil {
		Response(c, 500, "获取排行榜失败")
		return
	}

	Response(c, 200, "success", gin.H{
		"data": rankings,
	})
}

// SearchBooks 搜索书籍
// @Summary 搜索书籍
// @Description 根据关键词搜索书籍
// @Tags search
// @Param q query string true "搜索关键词"
// @Produce json
// @Success 200 {object} Response{data=[]model.Book}
// @Router /api/v1/search [get]
func SearchBooks(c *gin.Context) {
	keyword := c.Query("q")
	if keyword == "" {
		Response(c, 400, "请提供搜索关键词")
		return
	}

	var books []model.Book

	// 简单的文本搜索
	if err := config.DB.Where("title LIKE ? OR author LIKE ? OR description LIKE ?",
		"%"+keyword+"%",
		"%"+keyword+"%",
		"%"+keyword+"%",
	).Find(&books).Error; err != nil {
		Response(c, 500, "搜索失败")
		return
	}

	Response(c, 200, "success", gin.H{
		"data": books,
	})
}

// GetUserProfile 获取用户档案
func GetUserProfile(c *gin.Context) {
	Response(c, 200, "success", gin.H{
		"message": "用户档案功能开发中...",
	})
}

// UpdateUserProfile 更新用户档案
func UpdateUserProfile(c *gin.Context) {
	Response(c, 200, "success", gin.H{
		"message": "更新用户档案功能开发中...",
	})
}

// GetUserHistory 获取播放历史
func GetUserHistory(c *gin.Context) {
	Response(c, 200, "success", gin.H{
		"message": "播放历史功能开发中...",
	})
}

// UpdateUserHistory 更新播放历史
func UpdateUserHistory(c *gin.Context) {
	Response(c, 200, "success", gin.H{
		"message": "更新播放历史功能开发中...",
	})
}