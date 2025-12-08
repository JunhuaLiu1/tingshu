package api

import (
	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/api/v1"
	"github.com/username/tingshu-backend/tingshu/middleware"
)

func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// 中间件
	router.Use(middleware.CORS())
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Tingshu API is running",
		})
	})

	// API v1 路由组
	v1Group := router.Group("/api/v1")
	{
		// 书籍相关
		v1Group.GET("/books", v1.GetBooks)
		v1Group.GET("/books/:id", v1.GetBookByID)
		v1Group.GET("/books/:id/episodes", v1.GetBookEpisodes)

		// 分类相关
		v1Group.GET("/categories", v1.GetCategories)

		// 排行榜
		v1Group.GET("/rankings", v1.GetRankings)

		// 搜索
		v1Group.GET("/search", v1.SearchBooks)
	}

	return router
}
