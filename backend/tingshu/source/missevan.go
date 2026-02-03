package source

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const missevanBaseURL = "https://www.missevan.com"

type Missevan struct {
	client  *http.Client
	baseURL string
}

func NewMissevan() *Missevan {
	return &Missevan{
		client: &http.Client{
			Timeout: 15 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:      50,
				IdleConnTimeout:   90 * time.Second,
				DisableKeepAlives: false,
			},
		},
		baseURL: missevanBaseURL,
	}
}

func (m *Missevan) ID() string          { return "missevan" }
func (m *Missevan) Name() string        { return "猫耳FM" }
func (m *Missevan) Version() string     { return "1.0.0" }
func (m *Missevan) Description() string { return "猫耳FM二次元声音平台" }
func (m *Missevan) BaseURL() string     { return m.baseURL }
func (m *Missevan) IsSearchable() bool  { return true }
func (m *Missevan) HasCategories() bool { return true }
func (m *Missevan) NeedProxy() bool     { return false }
func (m *Missevan) NeedCookie() bool    { return false }

// missevan广播剧搜索响应结构
type missevanDramaSearchResp struct {
	Success bool `json:"success"`
	Info    struct {
		Datas []struct {
			ID        int    `json:"id"`
			Name      string `json:"name"`
			Cover     string `json:"cover"`
			Abstract  string `json:"abstract"`
			Author    string `json:"author"`
			ViewCount int    `json:"view_count"`
		} `json:"Datas"`
	} `json:"info"`
}

// missevan音频详情响应结构
type missevanSoundResp struct {
	Success bool `json:"success"`
	Info    struct {
		Sound struct {
			ID       int    `json:"id"`
			Soundstr string `json:"soundstr"`
			Username string `json:"username"`
			Duration int    `json:"duration"`
			Soundurl string `json:"soundurl"`
			Cover    string `json:"front_cover"`
			Intro    string `json:"intro"`
		} `json:"sound"`
	} `json:"info"`
}

func (m *Missevan) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}
	// 使用dramaapi搜索接口
	endpoint := fmt.Sprintf("%s/dramaapi/search?s=%s&p=%d", m.baseURL, url.QueryEscape(keyword), page)
	data, err := m.doGet(endpoint)
	if err != nil {
		return nil, err
	}
	var resp missevanDramaSearchResp
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}
	var books []Book
	for _, d := range resp.Info.Datas {
		books = append(books, Book{
			ID:          fmt.Sprintf("drama_%d", d.ID),
			Title:       d.Name,
			Author:      d.Author,
			CoverURL:    d.Cover,
			Description: d.Abstract,
			PlayCount:   d.ViewCount,
			SourceID:    m.ID(),
		})
	}
	return &SearchResult{Books: books, TotalPage: 1, CurrentPage: page}, nil
}

func (m *Missevan) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}
	endpoint := fmt.Sprintf("%s/sound/getsound?soundid=%s", m.baseURL, bookID)
	data, err := m.doGet(endpoint)
	if err != nil {
		return nil, err
	}
	var resp missevanSoundResp
	if err := json.Unmarshal(data, &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return nil, errors.New("failed to get sound info")
	}
	sound := resp.Info.Sound
	book := Book{
		ID:          fmt.Sprintf("%d", sound.ID),
		Title:       sound.Soundstr,
		Author:      sound.Username,
		CoverURL:    sound.Cover,
		Description: sound.Intro,
		SourceID:    m.ID(),
	}
	chapters := []Chapter{{
		ID:       bookID,
		Title:    sound.Soundstr,
		Index:    1,
		Duration: sound.Duration,
		IsFree:   true,
	}}
	return &BookDetail{Book: book, Chapters: chapters}, nil
}

func (m *Missevan) GetChapters(bookID string) ([]Chapter, error) {
	detail, err := m.GetBookDetail(bookID)
	if err != nil {
		return nil, err
	}
	return detail.Chapters, nil
}

func (m *Missevan) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}
	endpoint := fmt.Sprintf("%s/sound/getsound?soundid=%s", m.baseURL, episodeID)
	data, err := m.doGet(endpoint)
	if err != nil {
		return "", err
	}
	var resp missevanSoundResp
	if err := json.Unmarshal(data, &resp); err != nil {
		return "", err
	}
	if !resp.Success || resp.Info.Sound.Soundurl == "" {
		return "", errors.New("audio URL not found")
	}
	return resp.Info.Sound.Soundurl, nil
}

func (m *Missevan) GetCategories() ([]Category, error) {
	return []Category{
		{ID: "guangboju", Name: "广播剧"},
		{ID: "asmr", Name: "ASMR"},
		{ID: "yousheng", Name: "有声漫画"},
		{ID: "fanchang", Name: "翻唱"},
	}, nil
}

func (m *Missevan) HealthCheck() HealthStatus {
	_, err := m.client.Get(m.baseURL)
	if err != nil {
		return HealthStatus{Status: "down", SuccessRate: 0, LastCheckAt: time.Now(), Error: err.Error()}
	}
	return HealthStatus{Status: "healthy", SuccessRate: 1.0, LastCheckAt: time.Now()}
}

func (m *Missevan) doGet(endpoint string) ([]byte, error) {
	req, _ := http.NewRequest(http.MethodGet, endpoint, nil)
	req.Header.Set("User-Agent", GetRandomUserAgent())
	req.Header.Set("Accept", "application/json,text/html,*/*;q=0.8")
	resp, err := m.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}
