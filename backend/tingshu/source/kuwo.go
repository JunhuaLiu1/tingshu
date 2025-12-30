package source

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
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

	endpoint := fmt.Sprintf("%s/tingshu/api/data/album/songs?albumId=%s&online=0", kuwoBaseURL, url.QueryEscape(bookID))
	payload, err := k.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	var resp kuwoAlbumResponse
	if err := json.Unmarshal(payload, &resp); err != nil {
		return nil, err
	}
	if resp.Code != 200 {
		return nil, errors.New("获取章节失败")
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

	return &BookDetail{
		Book: Book{
			ID:       bookID,
			SourceID: k.ID(),
		},
		Episodes: episodes,
	}, nil
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
