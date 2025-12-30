package v1

import (
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func ProxyXimalayaAudio(c *gin.Context) {
	encryptedUrl := c.Query("url")
	if encryptedUrl == "" {
		c.Status(http.StatusBadRequest)
		return
	}

	// 构建喜马拉雅CDN URL
	audioUrl := "https://audiopay.cos.tx.xmcdn.com/" + encryptedUrl

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest(http.MethodGet, audioUrl, nil)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}

	// 设置必要的请求头
	req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")
	req.Header.Set("Referer", "https://www.ximalaya.com/")
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Encoding", "identity")

	// 支持Range请求
	if rangeHeader := c.GetHeader("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	resp, err := client.Do(req)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 复制响应头
	for key, values := range resp.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	// 设置CORS
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")

	c.Status(resp.StatusCode)
	io.Copy(c.Writer, resp.Body)
}
