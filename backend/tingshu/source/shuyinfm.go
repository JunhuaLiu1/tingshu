package source

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

const shuyinfmBaseURL = "https://www.shuyinfm.com"

// Shuyinfm 书音FM音源
type Shuyinfm struct {
	client  *http.Client
	baseURL string
}

// NewShuyinfm 创建书音FM音源实例
func NewShuyinfm() *Shuyinfm {
	return &Shuyinfm{
		client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:      50,
				IdleConnTimeout:   90 * time.Second,
				DisableKeepAlives: false,
			},
		},
		baseURL: shuyinfmBaseURL,
	}
}

func (s *Shuyinfm) ID() string {
	return "shuyinfm"
}

func (s *Shuyinfm) Name() string {
	return "书音FM"
}

func (s *Shuyinfm) Version() string {
	return "1.0.0"
}

func (s *Shuyinfm) Description() string {
	return "书音FM有声书平台"
}

func (s *Shuyinfm) BaseURL() string {
	return s.baseURL
}

func (s *Shuyinfm) IsSearchable() bool {
	return true
}

func (s *Shuyinfm) HasCategories() bool {
	return true
}

func (s *Shuyinfm) NeedProxy() bool {
	return false
}

func (s *Shuyinfm) NeedCookie() bool {
	return false
}

// Search 搜索书籍 - 使用POST请求
func (s *Shuyinfm) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}

	// POST请求到 /e/search/index.php
	searchURL := fmt.Sprintf("%s/e/search/index.php", s.baseURL)
	formData := url.Values{}
	formData.Set("keyboard", keyword)
	formData.Set("show", "title,newstext,player,playadmin")

	html, err := s.doPost(searchURL, formData)
	if err != nil {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}

	var books []Book
	// 使用正确的选择器: ul.qm-pic-txt li
	doc.Find(".qm-pic-txt li, .search_list li").Each(func(i int, sel *goquery.Selection) {
		// 获取链接: .s-tit a
		aTag := sel.Find(".s-tit a")
		href, exists := aTag.Attr("href")
		if !exists {
			return
		}

		// 提取ID: /album/2-74528.html -> 2-74528
		bookID := s.extractBookID(href)
		if bookID == "" {
			return
		}

		// 标题
		title := strings.TrimSpace(aTag.Text())

		// 封面: .pic img
		coverURL, _ := sel.Find(".pic img").Attr("src")

		// 作者和主播: .s-txt (格式: 作者：XXX 主播：YYY)
		authorText := strings.TrimSpace(sel.Find(".s-txt").First().Text())
		author := ""
		artist := ""
		if strings.Contains(authorText, "作者") || strings.Contains(authorText, "主播") {
			parts := strings.Split(authorText, " ")
			for _, p := range parts {
				p = strings.TrimSpace(p)
				if strings.HasPrefix(p, "作者：") || strings.HasPrefix(p, "作者:") {
					author = strings.TrimPrefix(strings.TrimPrefix(p, "作者："), "作者:")
				}
				if strings.HasPrefix(p, "主播：") || strings.HasPrefix(p, "主播:") {
					artist = strings.TrimPrefix(strings.TrimPrefix(p, "主播："), "主播:")
				}
			}
		}

		// 简介: .s-des
		desc := strings.TrimSpace(sel.Find(".s-des").Text())

		book := Book{
			ID:          bookID,
			Title:       title,
			Author:      author,
			Artist:      artist,
			CoverURL:    s.normalizeURL(coverURL),
			Description: desc,
			SourceID:    s.ID(),
		}
		books = append(books, book)
	})

	return &SearchResult{
		Books:       books,
		TotalPage:   1,
		CurrentPage: page,
	}, nil
}

// GetBookDetail 获取书籍详情
func (s *Shuyinfm) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}

	endpoint := fmt.Sprintf("%s/album/%s.html", s.baseURL, bookID)
	html, err := s.doGet(endpoint)
	if err != nil {
		endpoint = fmt.Sprintf("%s/book/%s.html", s.baseURL, bookID)
		html, err = s.doGet(endpoint)
		if err != nil {
			return nil, err
		}
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}

	book := Book{
		ID:       bookID,
		SourceID: s.ID(),
	}

	// 解析标题
	if title := doc.Find("h1, .book-title, .title").First().Text(); title != "" {
		book.Title = strings.TrimSpace(title)
	}

	// 解析作者
	if author := doc.Find(".author, .book-author").First().Text(); author != "" {
		book.Author = strings.TrimSpace(author)
	}

	// 解析播音
	if artist := doc.Find(".announcer, .artist, .reader").First().Text(); artist != "" {
		book.Artist = strings.TrimSpace(artist)
	}

	// 解析封面
	if coverURL, exists := doc.Find(".cover img, .book-cover img").First().Attr("src"); exists {
		book.CoverURL = s.normalizeURL(coverURL)
	}

	// 解析简介
	if desc := doc.Find(".intro, .description, .abstract").First().Text(); desc != "" {
		book.Description = strings.TrimSpace(desc)
	}

	// 解析章节
	var chapters []Chapter
	doc.Find(".chapter-list a, .playlist a, .episode-list a").Each(func(i int, sel *goquery.Selection) {
		href, exists := sel.Attr("href")
		if !exists {
			return
		}

		chapter := Chapter{
			ID:     strings.TrimSpace(href),
			Title:  strings.TrimSpace(sel.Text()),
			Index:  i + 1,
			IsFree: true,
		}
		chapters = append(chapters, chapter)
	})

	return &BookDetail{
		Book:     book,
		Chapters: chapters,
	}, nil
}

// GetChapters 获取章节列表
func (s *Shuyinfm) GetChapters(bookID string) ([]Chapter, error) {
	detail, err := s.GetBookDetail(bookID)
	if err != nil {
		return nil, err
	}
	return detail.Chapters, nil
}

// GetAudioURL 获取音频地址
func (s *Shuyinfm) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}

	endpoint := s.normalizeURL(episodeID)

	html, err := s.doGet(endpoint)
	if err != nil {
		return "", err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return "", err
	}

	var audioURL string

	// 尝试从audio标签获取
	doc.Find("audio source").Each(func(_ int, sel *goquery.Selection) {
		if audioURL != "" {
			return
		}
		if src, exists := sel.Attr("src"); exists {
			audioURL = strings.TrimSpace(src)
		}
	})

	if audioURL == "" {
		doc.Find("audio").Each(func(_ int, sel *goquery.Selection) {
			if audioURL != "" {
				return
			}
			if src, exists := sel.Attr("src"); exists {
				audioURL = strings.TrimSpace(src)
			}
			if audioURL == "" {
				if src, exists := sel.Attr("data-src"); exists {
					audioURL = strings.TrimSpace(src)
				}
			}
		})
	}

	// 从script标签解析
	if audioURL == "" {
		doc.Find("script").Each(func(_ int, sel *goquery.Selection) {
			if audioURL != "" {
				return
			}

			text := sel.Text()
			if strings.Contains(text, "audio") || strings.Contains(text, "mp3") || strings.Contains(text, "m4a") {
				re := regexp.MustCompile(`['"]([^'"]*\.(mp3|m4a|m3u8)[^'"]*)['"]`)
				matches := re.FindStringSubmatch(text)
				if len(matches) > 1 {
					audioURL = matches[1]
				}
			}
		})
	}

	audioURL = s.normalizeURL(audioURL)
	if audioURL != "" {
		return audioURL, nil
	}

	return "", errors.New("audio URL not found")
}

// GetCategories 获取分类
func (s *Shuyinfm) GetCategories() ([]Category, error) {
	categories := []Category{
		{ID: "xiaoshuo", Name: "有声小说", Count: 0},
		{ID: "pingshu", Name: "评书", Count: 0},
		{ID: "guangboju", Name: "广播剧", Count: 0},
		{ID: "ertong", Name: "儿童故事", Count: 0},
		{ID: "baijia", Name: "百家讲坛", Count: 0},
	}
	return categories, nil
}

// HealthCheck 健康检查
func (s *Shuyinfm) HealthCheck() HealthStatus {
	_, err := s.client.Get(s.baseURL)
	if err != nil {
		return HealthStatus{
			Status:      "down",
			SuccessRate: 0,
			LastCheckAt: time.Now(),
			Error:       err.Error(),
		}
	}

	return HealthStatus{
		Status:      "healthy",
		SuccessRate: 1.0,
		LastCheckAt: time.Now(),
	}
}

func (s *Shuyinfm) doGet(endpoint string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", GetRandomUserAgent())
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// doPost 执行POST请求，支持重定向跟随
func (s *Shuyinfm) doPost(endpoint string, data url.Values) ([]byte, error) {
	req, err := http.NewRequest(http.MethodPost, endpoint, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", GetRandomUserAgent())
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Referer", s.baseURL)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 400 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func (s *Shuyinfm) extractBookID(urlStr string) string {
	// 匹配 /album/2-74528.html 格式
	re := regexp.MustCompile(`/album/([\d-]+)\.html`)
	matches := re.FindStringSubmatch(urlStr)
	if len(matches) > 1 {
		return matches[1]
	}
	// 兼容旧格式 /book/123
	re2 := regexp.MustCompile(`/book/(\d+)`)
	matches2 := re2.FindStringSubmatch(urlStr)
	if len(matches2) > 1 {
		return matches2[1]
	}
	return ""
}

func (s *Shuyinfm) normalizeURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "//") {
		return "https:" + raw
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if strings.HasPrefix(raw, "/") {
		return s.baseURL + raw
	}
	return raw
}
