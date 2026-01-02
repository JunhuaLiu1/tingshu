package v1

import (
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
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

	proxyStream(c, audioUrl, "ximalaya")
}

func ProxyAudio(c *gin.Context) {
	sourceID := strings.ToLower(strings.TrimSpace(c.Query("source")))
	rawURL := strings.TrimSpace(c.Query("url"))
	if sourceID == "" || rawURL == "" {
		c.Status(http.StatusBadRequest)
		return
	}
	if !isAllowedSource(sourceID) {
		c.Status(http.StatusBadRequest)
		return
	}
	if len(rawURL) > 2048 {
		c.Status(http.StatusBadRequest)
		return
	}

	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" || parsed.User != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		c.Status(http.StatusBadRequest)
		return
	}

	host := strings.ToLower(parsed.Hostname())
	if host == "" || isBlockedHost(host) || !isAllowedHost(sourceID, host) {
		c.Status(http.StatusForbidden)
		return
	}

	proxyStream(c, parsed.String(), sourceID)
}

var proxyWhitelist = map[string][]string{
	"ximalaya": {"xmcdn.com", "ximalaya.com"},
	"kuwo":     {"kuwo.cn"},
	"huanting": {"huanting.cc"},
}

func isAllowedSource(sourceID string) bool {
	_, ok := proxyWhitelist[sourceID]
	return ok
}

func isAllowedHost(sourceID, host string) bool {
	suffixes := proxyWhitelist[sourceID]
	for _, suffix := range suffixes {
		if host == suffix || strings.HasSuffix(host, "."+suffix) {
			return true
		}
	}
	return false
}

func isBlockedHost(host string) bool {
	if host == "localhost" || strings.HasSuffix(host, ".local") {
		return true
	}
	if ip := net.ParseIP(host); ip != nil {
		if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() {
			return true
		}
	}
	return false
}

func proxyStream(c *gin.Context, targetURL, sourceID string) {
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest(http.MethodGet, targetURL, nil)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	req = req.WithContext(c.Request.Context())

	req.Header.Set("User-Agent", userAgentForSource(sourceID))
	if referer := refererForSource(sourceID); referer != "" {
		req.Header.Set("Referer", referer)
	}
	req.Header.Set("Accept", "*/*")
	req.Header.Set("Accept-Encoding", "identity")

	if rangeHeader := c.GetHeader("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	resp, err := client.Do(req)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for key, values := range resp.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")

	c.Status(resp.StatusCode)
	io.Copy(c.Writer, resp.Body)
}

func userAgentForSource(sourceID string) string {
	switch sourceID {
	case "kuwo":
		return "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
	case "huanting":
		return "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
	default:
		return "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
	}
}

func refererForSource(sourceID string) string {
	switch sourceID {
	case "kuwo":
		return "https://tingshu.kuwo.cn/"
	case "huanting":
		return "https://www.huanting.cc/"
	case "ximalaya":
		return "https://www.ximalaya.com/"
	default:
		return ""
	}
}
