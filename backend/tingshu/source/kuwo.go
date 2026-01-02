package source

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const kuwoBaseURL = "https://tingshu.kuwo.cn"

type Kuwo struct {
	client *http.Client
}

func NewKuwo() *Kuwo {
	return &Kuwo{
		client: &http.Client{Timeout: 12 * time.Second},
	}
}

func (k *Kuwo) ID() string {
	return "kuwo"
}

func (k *Kuwo) Name() string {
	return "酷我畅听"
}

func (k *Kuwo) Description() string {
	return "酷我畅听公开音源"
}

func (k *Kuwo) BaseURL() string {
	return kuwoBaseURL
}

func (k *Kuwo) Version() string {
	return "1.0.0"
}

func (k *Kuwo) IsSearchable() bool {
	return true
}

func (k *Kuwo) HasCategories() bool {
	return true
}

func (k *Kuwo) NeedProxy() bool {
	return false
}

func (k *Kuwo) NeedCookie() bool {
	return false
}

func (k *Kuwo) GetCategories() ([]Category, error) {
	return []Category{
		{ID: "xuanhuan", Name: "玄幻", Count: 0},
		{ID: "dushi", Name: "都市", Count: 0},
		{ID: "lishi", Name: "历史", Count: 0},
	}, nil
}

func (k *Kuwo) HealthCheck() HealthStatus {
	_, err := k.client.Get(kuwoBaseURL)
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

func (k *Kuwo) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}
	if page <= 0 {
		page = 1
	}

	endpoint := fmt.Sprintf(
		"%s/tingshu/api/search/Search?rn=10&type=album&version=8.5.6.1&wd=%s&pn=%d",
		kuwoBaseURL,
		url.QueryEscape(keyword),
		page,
	)

	payload, err := k.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	var resp kuwoSearchResponse
	if err := json.Unmarshal(payload, &resp); err != nil {
		return nil, err
	}

	books := make([]Book, 0, len(resp.Data.Data))
	for _, item := range resp.Data.Data {
		songTotal := atoiDefault(item.SongTotal)
		book := Book{
			ID:          strings.TrimSpace(item.AlbumID),
			Title:       strings.TrimSpace(item.AlbumName),
			Author:      strings.TrimSpace(item.ArtistName),
			CoverURL:    strings.TrimSpace(item.CoverImg),
			Description: strings.TrimSpace(item.Title),
			Status:      fmt.Sprintf("共 %d 集", songTotal),
			SourceID:    k.ID(),
			PlayCount:   atoiDefault(item.PlayCount),
		}
		books = append(books, book)
	}

	totalPage := 0
	total := atoiDefault(resp.Data.Total)
	if total > 0 {
		totalPage = (total + 9) / 10
	}

	return &SearchResult{
		Books:       books,
		TotalPage:   totalPage,
		CurrentPage: page,
	}, nil
}

func (k *Kuwo) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}

	return &BookDetail{
		Book: Book{
			ID:       bookID,
			SourceID: k.ID(),
		},
	}, nil
}

func (k *Kuwo) GetChapters(bookID string) ([]Chapter, error) {
	episodes, err := k.fetchAlbumEpisodes(bookID)
	if err != nil {
		return nil, err
	}

	chapters := make([]Chapter, len(episodes))
	for i, e := range episodes {
		chapters[i] = Chapter{
			ID:       e.ID,
			Title:    e.Title,
			Index:    i + 1,
			Duration: e.Duration,
			IsFree:   e.IsFree,
		}
	}
	return chapters, nil
}

func (k *Kuwo) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}

	rid := strings.TrimPrefix(episodeID, "MUSIC_")
	return fmt.Sprintf(
		"http://antiserver.kuwo.cn/anti.s?format=mp3&rid=MUSIC_%s&response=res&type=convert_url",
		url.QueryEscape(rid),
	), nil
}

func (k *Kuwo) doGet(endpoint string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", ximalayaUserAgent)
	req.Header.Set("Accept", "application/json")

	resp, err := k.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return payload, nil
}

type kuwoSearchResponse struct {
	Data struct {
		Total string `json:"total"`
		Data  []struct {
			AlbumID    string `json:"albumId"`
			AlbumName  string `json:"albumName"`
			CoverImg   string `json:"coverImg"`
			ArtistName string `json:"artistName"`
			SongTotal  string `json:"songTotal"`
			Title      string `json:"title"`
			PlayCount  string `json:"playCnt"`
		} `json:"data"`
	} `json:"data"`
}

type kuwoAlbumResponse struct {
	Code int    `json:"code"`
	Msg  string `json:"msg"`
	Data []struct {
		Name     string `json:"name"`
		MusicRID string `json:"musicrid"`
		Duration int    `json:"duration"`
	} `json:"data"`
}

func atoiDefault(value string) int {
	if value == "" {
		return 0
	}
	num, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return num
}

func (k *Kuwo) fetchAlbumEpisodes(bookID string) ([]Episode, error) {
	endpoints := []string{
		fmt.Sprintf("%s/tingshu/api/data/album/songs?albumId=%s&online=0", kuwoBaseURL, url.QueryEscape(bookID)),
		fmt.Sprintf("%s/tingshu/api/data/album/songs?albumId=%s&pn=1&rn=200&online=0", kuwoBaseURL, url.QueryEscape(bookID)),
		fmt.Sprintf("%s/tingshu/api/album/songs?albumId=%s&pn=1&rn=200", kuwoBaseURL, url.QueryEscape(bookID)),
		fmt.Sprintf("%s/tingshu/api/album/track?albumId=%s&pn=1&rn=200", kuwoBaseURL, url.QueryEscape(bookID)),
	}

	for _, endpoint := range endpoints {
		log.Printf("kuwo: 尝试获取章节 %s", endpoint)
		payload, err := k.doGet(endpoint)
		if err != nil {
			log.Printf("kuwo: 请求失败 %s err=%v", endpoint, err)
			continue
		}

		var resp kuwoAlbumResponse
		if err := json.Unmarshal(payload, &resp); err != nil {
			log.Printf("kuwo: 解析失败 %s err=%v", endpoint, err)
			continue
		}
		if resp.Code != 200 || len(resp.Data) == 0 {
			log.Printf("kuwo: 返回异常 %s code=%d msg=%s data_len=%d", endpoint, resp.Code, resp.Msg, len(resp.Data))
			continue
		}

		episodes := make([]Episode, 0, len(resp.Data))
		for _, item := range resp.Data {
			if item.MusicRID == "" {
				continue
			}
			rid := strings.TrimPrefix(item.MusicRID, "MUSIC_")
			episodes = append(episodes, Episode{
				ID:       rid,
				Title:    strings.TrimSpace(item.Name),
				Duration: item.Duration,
				IsFree:   true,
			})
		}
		if len(episodes) > 0 {
			return episodes, nil
		}
	}

	return nil, errors.New("获取章节失败")
}
