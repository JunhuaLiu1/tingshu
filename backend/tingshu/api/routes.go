package api

import (
	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/api/v1"
	"github.com/username/tingshu-backend/tingshu/middleware"
)

func SetupRoutes() *gin.Engine {
	router := gin.Default()

	// 全局中间件
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

	// API v1 路由
	v1Group := router.Group("/api/v1")
	{
		// 公开路由
		v1Group.GET("/books", v1.GetBooks)
		v1Group.GET("/books/:id", v1.GetBookByID)
		v1Group.GET("/books/:id/episodes", v1.GetBookEpisodes)
		v1Group.GET("/categories", v1.GetCategories)
		v1Group.GET("/rankings", v1.GetRankings)
		v1Group.GET("/rankings/:period", v1.GetRankingsByPeriod)
		v1Group.GET("/search", v1.SearchBooks)

		// 需要认证的路由（预留）
		authGroup := v1Group.Group("/users")
		authGroup.Use(middleware.Auth())
		{
			authGroup.GET("/:id/profile", v1.GetUserProfile)
			authGroup.PUT("/:id/profile", v1.UpdateUserProfile)
			authGroup.GET("/:id/history", v1.GetUserHistory)
			authGroup.PUT("/:id/history", v1.UpdateUserHistory)
		}
	}

	return router
}