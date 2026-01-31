package api

import (
	"github.com/gin-gonic/gin"
	v1 "github.com/username/tingshu-backend/tingshu/api/v1"
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
		// 健康检查（v1）
		// 前端默认 baseURL = .../api/v1，因此需要提供 /api/v1/health
		v1Group.GET("/health", func(c *gin.Context) {
			Success(c, gin.H{
				"status":  "ok",
				"message": "Tingshu API is running",
			})
		})

		// 书籍相关
		v1Group.GET("/books", v1.GetBooks)
		v1Group.GET("/books/:id", v1.GetBookByID)
		v1Group.GET("/books/:id/episodes", v1.GetBookEpisodes)

		// 分类相关
		v1Group.GET("/categories", v1.GetCategories)

		// 排行榜样
		v1Group.GET("/rankings", v1.GetRankings)

		// 搜索
		v1Group.GET("/search", v1.SearchBooks)

		// 音源
		v1Group.GET("/sources", v1.GetSources)
		v1Group.GET("/sources/status", v1.GetSourcesStatus)
		v1Group.POST("/global/search", v1.GlobalSearch)
		v1Group.GET("/sources/:id/search", v1.SearchSource)
		v1Group.GET("/sources/:id/books/:bookId", v1.GetSourceBookDetail)
		v1Group.GET("/sources/:id/chapters/:bookId", v1.GetSourceChapters)
		v1Group.GET("/sources/:id/audio/*episodeId", v1.GetSourceAudio)
		v1Group.POST("/sources/:id/disable", v1.DisableSource)
		v1Group.POST("/sources/:id/enable", v1.EnableSource)

		// 播放进度
		v1Group.POST("/playback/progress", v1.SavePlaybackProgress)
		v1Group.GET("/playback/progress", v1.GetPlaybackProgress)
		v1Group.GET("/users/:userId/history", v1.GetUserHistory)

		// 播放历史（需要认证）
		v1Group.POST("/history", middleware.Auth(), v1.SaveHistory)
		v1Group.GET("/history", middleware.Auth(), v1.GetHistory)
		v1Group.DELETE("/history/:id", middleware.Auth(), v1.DeleteHistory)
		v1Group.DELETE("/history", middleware.Auth(), v1.ClearHistory)

		// 音频代理
		v1Group.GET("/proxy/ximalaya", v1.ProxyXimalayaAudio)
		v1Group.GET("/proxy/audio", v1.ProxyAudio)

		// 认证
		v1Group.POST("/auth/register", v1.Register)
		v1Group.POST("/auth/login", v1.Login)
		v1Group.POST("/auth/password/reset/request", v1.RequestPasswordReset)
		v1Group.POST("/auth/password/reset/confirm", v1.ConfirmPasswordReset)
	}

	return router
}
