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

const leting8BaseURL = "https://www.leting8.com"

type Leting8 struct {
	client  *http.Client
	baseURL string
}

func NewLeting8() *Leting8 {
	return &Leting8{
		client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:      50,
				IdleConnTimeout:   90 * time.Second,
				DisableKeepAlives: false,
			},
		},
		baseURL: leting8BaseURL,
	}
}

func (l *Leting8) ID() string          { return "leting8" }
func (l *Leting8) Name() string        { return "乐听吧" }
func (l *Leting8) Version() string     { return "1.0.0" }
func (l *Leting8) Description() string { return "乐听吧有声小说平台" }
func (l *Leting8) BaseURL() string     { return l.baseURL }
func (l *Leting8) IsSearchable() bool  { return true }
func (l *Leting8) HasCategories() bool { return true }
func (l *Leting8) NeedProxy() bool     { return false }
func (l *Leting8) NeedCookie() bool    { return false }

func (l *Leting8) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}
	endpoint := fmt.Sprintf("%s/search.php?searchword=%s&page=%d", l.baseURL, url.QueryEscape(keyword), page)
	html, err := l.doGet(endpoint)
	if err != nil {
		return nil, err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}
	var books []Book
	doc.Find(".listbox li, .search-list li").Each(func(i int, sel *goquery.Selection) {
		aTag := sel.Find("a").First()
		href, exists := aTag.Attr("href")
		if !exists {
			return
		}
		bookID := l.extractBookID(href)
		if bookID == "" {
			return
		}
		title := strings.TrimSpace(aTag.Text())
		coverURL, _ := sel.Find("img").Attr("src")
		books = append(books, Book{
			ID: bookID, Title: title, CoverURL: l.normalizeURL(coverURL), SourceID: l.ID(),
		})
	})
	return &SearchResult{Books: books, TotalPage: 1, CurrentPage: page}, nil
}

func (l *Leting8) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}
	endpoint := fmt.Sprintf("%s/so/%s.html", l.baseURL, bookID)
	html, err := l.doGet(endpoint)
	if err != nil {
		return nil, err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return nil, err
	}
	book := Book{ID: bookID, SourceID: l.ID()}
	if title := doc.Find("h1").First().Text(); title != "" {
		book.Title = strings.TrimSpace(title)
	}
	if coverURL, exists := doc.Find(".cover img").First().Attr("src"); exists {
		book.CoverURL = l.normalizeURL(coverURL)
	}
	var chapters []Chapter
	doc.Find(".playlist a, .chapter-list a").Each(func(i int, sel *goquery.Selection) {
		href, exists := sel.Attr("href")
		if !exists {
			return
		}
		chapters = append(chapters, Chapter{
			ID: strings.TrimSpace(href), Title: strings.TrimSpace(sel.Text()), Index: i + 1, IsFree: true,
		})
	})
	return &BookDetail{Book: book, Chapters: chapters}, nil
}

func (l *Leting8) GetChapters(bookID string) ([]Chapter, error) {
	detail, err := l.GetBookDetail(bookID)
	if err != nil {
		return nil, err
	}
	return detail.Chapters, nil
}

func (l *Leting8) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}
	endpoint := l.normalizeURL(episodeID)
	html, err := l.doGet(endpoint)
	if err != nil {
		return "", err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(html)))
	if err != nil {
		return "", err
	}
	var audioURL string
	doc.Find("audio source, audio").Each(func(_ int, sel *goquery.Selection) {
		if audioURL != "" {
			return
		}
		if src, exists := sel.Attr("src"); exists && src != "" {
			audioURL = strings.TrimSpace(src)
		}
	})
	if audioURL == "" {
		doc.Find("script").Each(func(_ int, sel *goquery.Selection) {
			if audioURL != "" {
				return
			}
			text := sel.Text()
			if strings.Contains(text, "mp3") {
				re := regexp.MustCompile(`['"]([^'"]*\.mp3[^'"]*)['"]`)
				if m := re.FindStringSubmatch(text); len(m) > 1 {
					audioURL = m[1]
				}
			}
		})
	}
	audioURL = l.normalizeURL(audioURL)
	if audioURL != "" {
		return audioURL, nil
	}
	return "", errors.New("audio URL not found")
}

func (l *Leting8) GetCategories() ([]Category, error) {
	return []Category{
		{ID: "1", Name: "玄幻"}, {ID: "2", Name: "言情"}, {ID: "3", Name: "都市"},
		{ID: "4", Name: "恐怖"}, {ID: "13", Name: "评书"},
	}, nil
}

func (l *Leting8) HealthCheck() HealthStatus {
	_, err := l.client.Get(l.baseURL)
	if err != nil {
		return HealthStatus{Status: "down", SuccessRate: 0, LastCheckAt: time.Now(), Error: err.Error()}
	}
	return HealthStatus{Status: "healthy", SuccessRate: 1.0, LastCheckAt: time.Now()}
}

func (l *Leting8) doGet(endpoint string) ([]byte, error) {
	req, _ := http.NewRequest(http.MethodGet, endpoint, nil)
	req.Header.Set("User-Agent", GetRandomUserAgent())
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	resp, err := l.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

func (l *Leting8) extractBookID(urlStr string) string {
	re := regexp.MustCompile(`/so/(\d+)\.html`)
	if m := re.FindStringSubmatch(urlStr); len(m) > 1 {
		return m[1]
	}
	return ""
}

func (l *Leting8) normalizeURL(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "//") {
		return "https:" + raw
	}
	if strings.HasPrefix(raw, "http") {
		return raw
	}
	if strings.HasPrefix(raw, "/") {
		return l.baseURL + raw
	}
	return raw
}
