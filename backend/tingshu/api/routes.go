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

		// 音源
		v1Group.GET("/sources", v1.GetSources)
		v1Group.GET("/sources/:id/search", v1.SearchSource)
		v1Group.GET("/sources/:id/books/:bookId", v1.GetSourceBookDetail)
		v1Group.GET("/sources/:id/audio/:episodeId", v1.GetSourceAudio)

		// 播放进度
		v1Group.POST("/playback/progress", v1.SavePlaybackProgress)
		v1Group.GET("/playback/progress", v1.GetPlaybackProgress)
		v1Group.GET("/users/:userId/history", v1.GetUserHistory)

		// 音频代理
		v1Group.GET("/proxy/ximalaya", v1.ProxyXimalayaAudio)
	}

	return router
}
