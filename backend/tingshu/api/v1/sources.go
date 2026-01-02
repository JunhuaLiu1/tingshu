package v1

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
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
		_ = sourceManager.Register(source.NewKuwo())
		_ = sourceManager.Register(source.NewHuanting())
	})
	return sourceManager
}

func GetSources(c *gin.Context) {
	manager := getSourceManager()
	Success(c, manager.List())
}

func GetSourcesStatus(c *gin.Context) {
	manager := getSourceManager()
	Success(c, gin.H{
		"total":   len(manager.List()),
		"sources": manager.List(),
	})
}

func GlobalSearch(c *gin.Context) {
	manager := getSourceManager()
	query := c.Query("q")

	if query == "" {
		Error(c, http.StatusBadRequest, "Search query is required")
		return
	}

	results := manager.GlobalSearch(query)

	Success(c, gin.H{
		"total":   len(results),
		"results": results,
	})
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
		c.Error(err)
		Error(c, http.StatusBadGateway, err.Error())
		return
	}
	if len(detail.Chapters) == 0 {
		chapters, err := src.GetChapters(bookID)
		if err != nil {
			Error(c, http.StatusBadGateway, err.Error())
			return
		}
		detail.Chapters = chapters
	}
	Success(c, detail)
}

func GetSourceChapters(c *gin.Context) {
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

	chapters, err := src.GetChapters(bookID)
	if err != nil {
		Error(c, http.StatusBadGateway, err.Error())
		return
	}
	Success(c, chapters)
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
	Success(c, gin.H{
		"audio_url":       audioURL,
		"audio_proxy_url": buildProxyURL(c, sourceID, audioURL),
	})
}

func DisableSource(c *gin.Context) {
	sourceID := c.Param("id")

	manager := getSourceManager()
	manager.Disable(sourceID)

	Success(c, gin.H{
		"message": "source disabled",
		"id":      sourceID,
	})
}

func EnableSource(c *gin.Context) {
	sourceID := c.Param("id")

	manager := getSourceManager()
	manager.Enable(sourceID)

	Success(c, gin.H{
		"message": "source enabled",
		"id":      sourceID,
	})
}

func buildProxyURL(c *gin.Context, sourceID, audioURL string) string {
	if strings.TrimSpace(sourceID) == "" || strings.TrimSpace(audioURL) == "" {
		return ""
	}

	scheme := "http"
	if forwarded := c.GetHeader("X-Forwarded-Proto"); forwarded != "" {
		scheme = strings.TrimSpace(strings.Split(forwarded, ",")[0])
	} else if c.Request.TLS != nil {
		scheme = "https"
	}

	host := c.GetHeader("X-Forwarded-Host")
	if host == "" {
		host = c.Request.Host
	}
	if host != "" {
		host = strings.TrimSpace(strings.Split(host, ",")[0])
	}
	if host == "" {
		return ""
	}

	return fmt.Sprintf(
		"%s://%s/api/v1/proxy/audio?source=%s&url=%s",
		scheme,
		host,
		url.QueryEscape(sourceID),
		url.QueryEscape(audioURL),
	)
}
