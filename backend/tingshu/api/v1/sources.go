package v1

import (
	"net/http"
	"strconv"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/source"
)

var (
	sourceOnce    sync.Once
	sourceManager *source.Manager
)

func getSourceManager() *source.Manager {
	sourceOnce.Do(func() {
		sourceManager = source.NewManager()
		_ = sourceManager.Register(source.NewXimalaya())
	})
	return sourceManager
}

func GetSources(c *gin.Context) {
	manager := getSourceManager()
	Success(c, manager.List())
}

func SearchSource(c *gin.Context) {
	sourceID := c.Param("id")
	query := c.Query("q")
	if query == "" {
		Error(c, http.StatusBadRequest, "Search query is required")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	manager := getSourceManager()
	src, ok := manager.Get(sourceID)
	if !ok {
		Error(c, http.StatusNotFound, "Source not found")
		return
	}

	result, err := src.Search(query, page)
	if err != nil {
		Error(c, http.StatusBadGateway, err.Error())
		return
	}
	Success(c, result)
}

func GetSourceBookDetail(c *gin.Context) {
	sourceID := c.Param("id")
	bookID := c.Param("bookId")
	if bookID == "" {
		Error(c, http.StatusBadRequest, "Book id is required")
		return
	}

	manager := getSourceManager()
	src, ok := manager.Get(sourceID)
	if !ok {
		Error(c, http.StatusNotFound, "Source not found")
		return
	}

	detail, err := src.GetBookDetail(bookID)
	if err != nil {
		Error(c, http.StatusBadGateway, err.Error())
		return
	}
	Success(c, detail)
}

func GetSourceAudio(c *gin.Context) {
	sourceID := c.Param("id")
	episodeID := c.Param("episodeId")
	if episodeID == "" {
		Error(c, http.StatusBadRequest, "Episode id is required")
		return
	}

	manager := getSourceManager()
	src, ok := manager.Get(sourceID)
	if !ok {
		Error(c, http.StatusNotFound, "Source not found")
		return
	}

	audioURL, err := src.GetAudioURL(episodeID)
	if err != nil {
		Error(c, http.StatusBadGateway, err.Error())
		return
	}
	Success(c, gin.H{"audio_url": audioURL})
}
