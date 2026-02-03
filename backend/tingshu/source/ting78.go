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

const ting78BaseURL = "https://www.ting78.com"

// Ting78 七八听书网音源
type Ting78 struct {
	client  *http.Client
	baseURL string
}

// NewTing78 创建七八听书网音源实例
func NewTing78() *Ting78 {
	return &Ting78{
		client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:      50,
				IdleConnTimeout:   90 * time.Second,
				DisableKeepAlives: false,
			},
		},
		baseURL: ting78BaseURL,
	}
}

func (t *Ting78) ID() string {
	return "ting78"
}

func (t *Ting78) Name() string {
	return "七八听书网"
}

func (t *Ting78) Version() string {
	return "1.0.0"
}

func (t *Ting78) Description() string {
	return "七八听书网有声小说平台"
}

func (t *Ting78) BaseURL() string {
	return t.baseURL
}

func (t *Ting78) IsSearchable() bool {
	return true
}

func (t *Ting78) HasCategories() bool {
	return true
}

func (t *Ting78) NeedProxy() bool {
	return false
}

func (t *Ting78) NeedCookie() bool {
	return false
}

// Search 搜索书籍
func (t *Ting78) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}

	endpoint := fmt.Sprintf("%s/search.php?searchword=%s&page=%d", t.baseURL, url.QueryEscape(keyword), page)

	html, err := t.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}

	var books []Book
	doc.Find(".listbox li, .search-list li, .book-list li").Each(func(i int, sel *goquery.Selection) {
		aTag := sel.Find("a").First()
		href, exists := aTag.Attr("href")
		if !exists {
			return
		}

		bookID := t.extractBookID(href)
		if bookID == "" {
			return
		}

		title := strings.TrimSpace(aTag.Text())
		coverURL, _ := sel.Find("img").Attr("src")

		// 尝试获取作者信息
		author := ""
		sel.Find(".author, .info span").Each(func(_ int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if strings.Contains(text, "作者") || author == "" {
				author = text
			}
		})

		book := Book{
			ID:       bookID,
			Title:    title,
			Author:   author,
			CoverURL: t.normalizeURL(coverURL),
			SourceID: t.ID(),
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
func (t *Ting78) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}

	endpoint := fmt.Sprintf("%s/mp3/%s.html", t.baseURL, bookID)

	html, err := t.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}

	book := Book{
		ID:       bookID,
		SourceID: t.ID(),
	}

	// 解析标题
	if title := doc.Find("h1, .title, .book-name").First().Text(); title != "" {
		book.Title = strings.TrimSpace(title)
	}

	// 解析作者
	doc.Find(".info span, .detail-info p").Each(func(_ int, sel *goquery.Selection) {
		text := strings.TrimSpace(sel.Text())
		if strings.Contains(text, "作者") {
			book.Author = strings.TrimPrefix(text, "作者：")
			book.Author = strings.TrimPrefix(book.Author, "作者:")
		}
		if strings.Contains(text, "播音") || strings.Contains(text, "演播") {
			book.Artist = strings.TrimPrefix(text, "播音：")
			book.Artist = strings.TrimPrefix(book.Artist, "播音:")
		}
	})

	// 解析封面
	if coverURL, exists := doc.Find(".cover img, .book-img img").First().Attr("src"); exists {
		book.CoverURL = t.normalizeURL(coverURL)
	}

	// 解析简介
	if desc := doc.Find(".intro, .description, .book-intro").First().Text(); desc != "" {
		book.Description = strings.TrimSpace(desc)
	}

	// 解析章节
	var chapters []Chapter
	doc.Find(".playlist li a, .chapter-list a, #playlist a").Each(func(i int, sel *goquery.Selection) {
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
func (t *Ting78) GetChapters(bookID string) ([]Chapter, error) {
	detail, err := t.GetBookDetail(bookID)
	if err != nil {
		return nil, err
	}
	return detail.Chapters, nil
}

// GetAudioURL 获取音频地址
func (t *Ting78) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}

	endpoint := t.normalizeURL(episodeID)

	html, err := t.doGet(endpoint)
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
		})
	}

	// 从script标签解析
	if audioURL == "" {
		doc.Find("script").Each(func(_ int, sel *goquery.Selection) {
			if audioURL != "" {
				return
			}

			text := sel.Text()
			if strings.Contains(text, "mp3") || strings.Contains(text, "audio") {
				re := regexp.MustCompile(`['"]([^'"]*\.mp3[^'"]*)['"]`)
				matches := re.FindStringSubmatch(text)
				if len(matches) > 1 {
					audioURL = matches[1]
				}
			}
		})
	}

	audioURL = t.normalizeURL(audioURL)
	if audioURL != "" {
		return audioURL, nil
	}

	return "", errors.New("audio URL not found")
}

// GetCategories 获取分类
func (t *Ting78) GetCategories() ([]Category, error) {
	categories := []Category{
		{ID: "1", Name: "玄幻", Count: 0},
		{ID: "2", Name: "言情", Count: 0},
		{ID: "3", Name: "都市", Count: 0},
		{ID: "4", Name: "恐怖", Count: 0},
		{ID: "5", Name: "惊悚", Count: 0},
		{ID: "6", Name: "推理", Count: 0},
		{ID: "7", Name: "武侠", Count: 0},
	}
	return categories, nil
}

// HealthCheck 健康检查
func (t *Ting78) HealthCheck() HealthStatus {
	_, err := t.client.Get(t.baseURL)
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

func (t *Ting78) doGet(endpoint string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", GetRandomUserAgent())
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	resp, err := t.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func (t *Ting78) extractBookID(urlStr string) string {
	re := regexp.MustCompile(`/mp3/(\d+)\.html`)
	matches := re.FindStringSubmatch(urlStr)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func (t *Ting78) normalizeURL(raw string) string {
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
		return t.baseURL + raw
	}
	return raw
}
