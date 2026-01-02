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

const huantingBaseURL = "https://www.huanting.cc"

type Huanting struct {
	client  *http.Client
	baseURL string
}

func NewHuanting() *Huanting {
	return &Huanting{
		client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:      50,
				IdleConnTimeout:   90 * time.Second,
				DisableKeepAlives: false,
			},
		},
		baseURL: huantingBaseURL,
	}
}

func (h *Huanting) ID() string {
	return "huanting"
}

func (h *Huanting) Name() string {
	return "一夜听书网"
}

func (h *Huanting) Version() string {
	return "1.0.0"
}

func (h *Huanting) Description() string {
	return "一夜听书网听书平台"
}

func (h *Huanting) BaseURL() string {
	return h.baseURL
}

func (h *Huanting) IsSearchable() bool {
	return true
}

func (h *Huanting) HasCategories() bool {
	return true
}

func (h *Huanting) NeedProxy() bool {
	return false
}

func (h *Huanting) NeedCookie() bool {
	return false
}

func (h *Huanting) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}

	endpoint := fmt.Sprintf("%s/search.php?q=%s", h.baseURL, url.QueryEscape(keyword))

	html, err := h.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}

	var books []Book
	doc.Find(".hotspot_tit").Each(func(i int, sel *goquery.Selection) {
		href, exists := sel.Attr("href")
		if !exists {
			return
		}

		bookID := extractBookIDFromURL(href)
		if bookID == "" {
			return
		}

		book := Book{
			ID:       bookID,
			Title:    strings.TrimSpace(sel.Text()),
			SourceID: h.ID(),
		}
		books = append(books, book)
	})

	return &SearchResult{
		Books:       books,
		TotalPage:   1,
		CurrentPage: page,
	}, nil
}

func (h *Huanting) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}

	endpoint := fmt.Sprintf("%s/book/%s.html", h.baseURL, bookID)

	html, err := h.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}

	book := Book{
		ID:       bookID,
		SourceID: h.ID(),
	}

	if title := doc.Find(".title h1").Text(); title != "" {
		book.Title = strings.TrimSpace(title)
	}

	if author := doc.Find(".author").Text(); author != "" {
		book.Author = strings.TrimSpace(author)
	}

	if announcer := doc.Find(".announcer").Text(); announcer != "" {
		book.Artist = strings.TrimSpace(announcer)
	}

	if coverURL, exists := doc.Find(".right .img img").Attr("src"); exists {
		book.CoverURL = strings.TrimSpace(coverURL)
	}

	if desc := doc.Find(".abstract").Text(); desc != "" {
		book.Description = strings.TrimSpace(desc)
	}

	var chapters []Chapter
	doc.Find("#vlink li a").Each(func(i int, sel *goquery.Selection) {
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

func (h *Huanting) GetChapters(bookID string) ([]Chapter, error) {
	detail, err := h.GetBookDetail(bookID)
	if err != nil {
		return nil, err
	}
	return detail.Chapters, nil
}

func (h *Huanting) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}

	endpoint := fmt.Sprintf("%s%s", h.baseURL, episodeID)

	html, err := h.doGet(endpoint)
	if err != nil {
		return "", err
	}

	doc, _ := goquery.NewDocumentFromReader(strings.NewReader(string(html)))

	var audioURL string
	doc.Find("script").Each(func(i int, sel *goquery.Selection) {
		if audioURL != "" {
			return
		}

		text := sel.Text()
		if strings.Contains(text, "audio") || strings.Contains(text, "mp3") {
			re := regexp.MustCompile(`['"]([^'"]*\.mp3[^'"]*)['"]`)
			matches := re.FindStringSubmatch(text)
			if len(matches) > 1 {
				audioURL = matches[1]
			}
		}
	})

	if audioURL != "" {
		return audioURL, nil
	}

	return "", errors.New("audio URL not found")
}

func (h *Huanting) GetCategories() ([]Category, error) {
	categories := []Category{
		{ID: "xuanhuan", Name: "玄幻武侠", Count: 0},
		{ID: "dushi", Name: "都市言情", Count: 0},
		{ID: "kongbu", Name: "恐怖悬疑", Count: 0},
		{ID: "xingzhen", Name: "刑侦推理", Count: 0},
		{ID: "shangzhan", Name: "职场商战", Count: 0},
		{ID: "junshi", Name: "军事历史", Count: 0},
		{ID: "wangyou", Name: "网游竞技", Count: 0},
	}
	return categories, nil
}

func (h *Huanting) HealthCheck() HealthStatus {
	_, err := h.client.Get(h.baseURL)
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

func (h *Huanting) doGet(endpoint string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", GetRandomUserAgent())
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	resp, err := h.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func extractBookIDFromURL(urlStr string) string {
	re := regexp.MustCompile(`/book/(\d+)\.html`)
	matches := re.FindStringSubmatch(urlStr)
	if len(matches) > 1 {
		return matches[1]
	}
	return ""
}
