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

const tingsmBaseURL = "https://www.tingsm.com"

// Tingsm 听书迷音源
type Tingsm struct {
	client  *http.Client
	baseURL string
}

// NewTingsm 创建听书迷音源实例
func NewTingsm() *Tingsm {
	return &Tingsm{
		client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:      50,
				IdleConnTimeout:   90 * time.Second,
				DisableKeepAlives: false,
			},
		},
		baseURL: tingsmBaseURL,
	}
}

func (t *Tingsm) ID() string {
	return "tingsm"
}

func (t *Tingsm) Name() string {
	return "听书迷"
}

func (t *Tingsm) Version() string {
	return "1.0.0"
}

func (t *Tingsm) Description() string {
	return "听书迷有声小说平台"
}

func (t *Tingsm) BaseURL() string {
	return t.baseURL
}

func (t *Tingsm) IsSearchable() bool {
	return true
}

func (t *Tingsm) HasCategories() bool {
	return true
}

func (t *Tingsm) NeedProxy() bool {
	return false
}

func (t *Tingsm) NeedCookie() bool {
	return false
}

// Search 搜索书籍
func (t *Tingsm) Search(keyword string, page int) (*SearchResult, error) {
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
	doc.Find(".listbox li, .book-list li, .search-result li").Each(func(i int, sel *goquery.Selection) {
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
		if title == "" {
			title = strings.TrimSpace(sel.Find(".title").Text())
		}
		coverURL, _ := sel.Find("img").Attr("src")

		book := Book{
			ID:       bookID,
			Title:    title,
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
func (t *Tingsm) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}

	endpoint := fmt.Sprintf("%s/book/%s.html", t.baseURL, bookID)

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
	if title := doc.Find("h1, .book-title").First().Text(); title != "" {
		book.Title = strings.TrimSpace(title)
	}

	// 解析作者和播音
	doc.Find(".info p, .book-info span").Each(func(_ int, sel *goquery.Selection) {
		text := strings.TrimSpace(sel.Text())
		if strings.Contains(text, "作者") {
			book.Author = strings.TrimPrefix(text, "作者：")
			book.Author = strings.TrimPrefix(book.Author, "作者:")
		}
		if strings.Contains(text, "播音") {
			book.Artist = strings.TrimPrefix(text, "播音：")
			book.Artist = strings.TrimPrefix(book.Artist, "播音:")
		}
	})

	// 解析封面
	if coverURL, exists := doc.Find(".book-cover img, .cover img").First().Attr("src"); exists {
		book.CoverURL = t.normalizeURL(coverURL)
	}

	// 解析简介
	if desc := doc.Find(".intro, .book-intro").First().Text(); desc != "" {
		book.Description = strings.TrimSpace(desc)
	}

	// 解析章节
	var chapters []Chapter
	doc.Find(".playlist a, .chapter-list a").Each(func(i int, sel *goquery.Selection) {
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
func (t *Tingsm) GetChapters(bookID string) ([]Chapter, error) {
	detail, err := t.GetBookDetail(bookID)
	if err != nil {
		return nil, err
	}
	return detail.Chapters, nil
}

// GetAudioURL 获取音频地址
func (t *Tingsm) GetAudioURL(episodeID string) (string, error) {
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
	doc.Find("audio source, audio").Each(func(_ int, sel *goquery.Selection) {
		if audioURL != "" {
			return
		}
		if src, exists := sel.Attr("src"); exists && src != "" {
			audioURL = strings.TrimSpace(src)
		}
	})

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
func (t *Tingsm) GetCategories() ([]Category, error) {
	categories := []Category{
		{ID: "xuanhuan", Name: "玄幻奇幻", Count: 0},
		{ID: "yanqing", Name: "都市言情", Count: 0},
		{ID: "kongbu", Name: "恐怖悬疑", Count: 0},
		{ID: "lishi", Name: "历史军事", Count: 0},
		{ID: "wuxia", Name: "武侠仙侠", Count: 0},
	}
	return categories, nil
}

// HealthCheck 健康检查
func (t *Tingsm) HealthCheck() HealthStatus {
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

func (t *Tingsm) doGet(endpoint string) ([]byte, error) {
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

func (t *Tingsm) extractBookID(urlStr string) string {
	re := regexp.MustCompile(`/book/(\d+)\.html`)
	matches := re.FindStringSubmatch(urlStr)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}

func (t *Tingsm) normalizeURL(raw string) string {
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
