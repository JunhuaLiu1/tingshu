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
	"sync"
	"time"
)

const (
	ximalayaBaseURL   = "https://www.ximalaya.com"
	ximalayaUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

type Ximalaya struct {
	client     *http.Client
	baseURL    string
	audioCache *audioURLCache
}

func NewXimalaya() *Ximalaya {
	return &Ximalaya{
		client:  &http.Client{Timeout: 12 * time.Second},
		baseURL: ximalayaBaseURL,
		audioCache: &audioURLCache{
			items: make(map[string]audioURLCacheItem),
		},
	}
}

func (x *Ximalaya) ID() string {
	return "ximalaya"
}

func (x *Ximalaya) Name() string {
	return "喜马拉雅"
}

func (x *Ximalaya) Description() string {
	return "喜马拉雅公开免费内容"
}

func (x *Ximalaya) BaseURL() string {
	return x.baseURL
}

func (x *Ximalaya) Search(keyword string, page int) (*SearchResult, error) {
	if strings.TrimSpace(keyword) == "" {
		return nil, errors.New("keyword is empty")
	}
	if page <= 0 {
		page = 1
	}

	endpoint := fmt.Sprintf("%s/revision/search/main?kw=%s&page=%d&spellchecker=true&core=album", x.baseURL, url.QueryEscape(keyword), page)
	payload, err := x.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	root, err := decodeJSON(payload)
	if err != nil {
		return nil, err
	}
	if err := checkXimalayaRet(root); err != nil {
		return nil, err
	}

	data, ok := root["data"].(map[string]interface{})
	if !ok {
		return nil, errors.New("invalid search response")
	}
	if reason, ok := data["reason"].(string); ok && reason != "" {
		return &SearchResult{
			Books:       []Book{},
			TotalPage:   0,
			CurrentPage: page,
		}, nil
	}

	albumBlock, ok := data["album"].(map[string]interface{})
	if !ok {
		if fallback, ok := data["albums"].(map[string]interface{}); ok {
			albumBlock = fallback
		} else {
			return nil, errors.New("album data missing")
		}
	}

	var docs []interface{}
	if rawDocs, ok := albumBlock["docs"].([]interface{}); ok {
		docs = rawDocs
	} else if rawDocs, ok := albumBlock["list"].([]interface{}); ok {
		docs = rawDocs
	}

	books := make([]Book, 0, len(docs))
	for _, item := range docs {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		id := pickString(itemMap, "id", "albumId")
		if id == "" {
			continue
		}
		book := Book{
			ID:          id,
			Title:       pickString(itemMap, "title", "albumTitle", "name"),
			Author:      pickString(itemMap, "author", "anchorName"),
			Artist:      pickString(itemMap, "artist", "announcer"),
			CoverURL:    pickString(itemMap, "cover", "coverPath", "cover_url", "coverUrl", "coverLarge", "coverMiddle", "coverSmall"),
			Description: pickString(itemMap, "intro", "description", "shortIntro"),
			Status:      formatStatus(itemMap),
			SourceID:    x.ID(),
			PlayCount:   pickInt(itemMap, "playCount", "play_count", "playsCounts", "tracksPlayCount"),
		}
		books = append(books, book)
	}

	result := &SearchResult{
		Books:       books,
		TotalPage:   pickInt(albumBlock, "totalPage", "totalPageCount", "total_page"),
		CurrentPage: pickInt(albumBlock, "page", "currentPage", "pageNum"),
	}
	if result.CurrentPage == 0 {
		result.CurrentPage = page
	}
	return result, nil
}

func (x *Ximalaya) GetBookDetail(bookID string) (*BookDetail, error) {
	if strings.TrimSpace(bookID) == "" {
		return nil, errors.New("book id is empty")
	}

	book := Book{
		ID:       bookID,
		SourceID: x.ID(),
	}

	albumInfo, err := x.fetchAlbumSimple(bookID)
	if err != nil {
		return nil, err
	}
	if albumInfo != nil {
		book.Title = albumInfo.Title
		book.Author = albumInfo.Author
		book.Artist = albumInfo.Artist
		book.CoverURL = albumInfo.CoverURL
		book.Description = albumInfo.Description
		book.Status = albumInfo.Status
	}

	episodes, err := x.fetchTracks(bookID)
	if err != nil {
		return nil, err
	}

	return &BookDetail{
		Book:     book,
		Episodes: episodes,
	}, nil
}

func (x *Ximalaya) GetAudioURL(episodeID string) (string, error) {
	if strings.TrimSpace(episodeID) == "" {
		return "", errors.New("episode id is empty")
	}

	if cached := x.audioCache.Get(episodeID); cached != "" {
		return cached, nil
	}

	qualities := []int{2, 1, 0}
	var lastErr error
	for _, quality := range qualities {
		audioURL, err := x.fetchAudioURL(episodeID, quality)
		if err != nil {
			lastErr = err
			continue
		}
		if audioURL == "" {
			continue
		}
		x.audioCache.Set(episodeID, audioURL, 10*time.Minute)
		return audioURL, nil
	}

	if lastErr != nil {
		return "", lastErr
	}
	return "", errors.New("audio url not found")
}

func (x *Ximalaya) fetchAlbumSimple(bookID string) (*Book, error) {
	endpoint := fmt.Sprintf("%s/revision/album/v1/simple?albumId=%s", x.baseURL, url.QueryEscape(bookID))
	payload, err := x.doGet(endpoint)
	if err != nil {
		return nil, err
	}
	root, err := decodeJSON(payload)
	if err != nil {
		return nil, err
	}
	if err := checkXimalayaRet(root); err != nil {
		return nil, err
	}

	data, ok := root["data"].(map[string]interface{})
	if !ok {
		return nil, errors.New("invalid album response")
	}
	if reason, ok := data["reason"].(string); ok && reason != "" {
		return nil, errors.New("album blocked by risk control")
	}

	book := &Book{
		ID:          bookID,
		Title:       pickString(data, "title", "albumTitle", "name"),
		Author:      pickString(data, "author", "anchorName"),
		Artist:      pickString(data, "announcer", "artist"),
		CoverURL:    pickString(data, "cover", "coverPath", "cover_url", "coverUrl", "coverLarge", "coverMiddle", "coverSmall"),
		Description: pickString(data, "intro", "description", "shortIntro"),
		Status:      formatStatus(data),
		SourceID:    x.ID(),
		PlayCount:   pickInt(data, "playCount", "play_count", "playsCounts", "tracksPlayCount"),
	}
	return book, nil
}

func (x *Ximalaya) fetchTracks(bookID string) ([]Episode, error) {
	pageSize := 100
	pageNum := 1
	var episodes []Episode

	for {
		endpoint := fmt.Sprintf("%s/revision/album/v1/getTracksList?albumId=%s&pageNum=%d&pageSize=%d", x.baseURL, url.QueryEscape(bookID), pageNum, pageSize)
		payload, err := x.doGet(endpoint)
		if err != nil {
			return nil, err
		}
		root, err := decodeJSON(payload)
		if err != nil {
			return nil, err
		}
		if err := checkXimalayaRet(root); err != nil {
			return nil, err
		}
		data, ok := root["data"].(map[string]interface{})
		if !ok {
			return nil, errors.New("invalid tracks response")
		}
		if reason, ok := data["reason"].(string); ok && reason != "" {
			return nil, errors.New("tracks blocked by risk control")
		}

		tracksRaw, ok := data["tracks"].([]interface{})
		if !ok || len(tracksRaw) == 0 {
			break
		}

		for _, item := range tracksRaw {
			trackMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}
			episode := Episode{
				ID:       pickString(trackMap, "trackId", "id"),
				Title:    pickString(trackMap, "title", "trackTitle"),
				Duration: pickInt(trackMap, "duration"),
				IsFree:   !pickBool(trackMap, "isPaid", "is_paid"),
				AudioURL: pickTrackAudioURL(trackMap),
			}
			if episode.ID == "" {
				continue
			}
			if !episode.IsFree {
				continue
			}
			episodes = append(episodes, episode)
		}

		trackTotal := pickInt(data, "trackTotalCount")
		if trackTotal > 0 && len(episodes) >= trackTotal {
			break
		}
		pageNum++
		if pageNum > 10 {
			break
		}
	}

	return episodes, nil
}

func (x *Ximalaya) fetchAudioURL(episodeID string, quality int) (string, error) {
	timestamp := time.Now().UnixMilli()
	endpoint := fmt.Sprintf("%s/mobile-playpage/track/v3/baseInfo/%d?device=www2&trackId=%s&trackQualityLevel=%d", x.baseURL, timestamp, url.QueryEscape(episodeID), quality)
	payload, err := x.doGet(endpoint)
	if err != nil {
		return "", err
	}
	root, err := decodeJSON(payload)
	if err != nil {
		return "", err
	}
	if err := checkXimalayaRet(root); err != nil {
		return "", err
	}
	data, ok := root["data"].(map[string]interface{})
	if !ok {
		return "", errors.New("invalid audio response")
	}

	if pickBool(data, "isPaid", "is_paid") {
		return "", errors.New("该内容需要授权")
	}

	return pickAudioURL(data), nil
}

func (x *Ximalaya) doGet(endpoint string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", ximalayaUserAgent)
	req.Header.Set("Referer", x.baseURL+"/")
	req.Header.Set("Accept", "application/json")

	resp, err := x.client.Do(req)
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

type audioURLCacheItem struct {
	url      string
	expireAt time.Time
}

type audioURLCache struct {
	mu    sync.RWMutex
	items map[string]audioURLCacheItem
}

func (c *audioURLCache) Get(id string) string {
	c.mu.RLock()
	item, ok := c.items[id]
	c.mu.RUnlock()
	if !ok {
		return ""
	}
	if time.Now().After(item.expireAt) {
		c.mu.Lock()
		delete(c.items, id)
		c.mu.Unlock()
		return ""
	}
	return item.url
}

func (c *audioURLCache) Set(id, url string, ttl time.Duration) {
	if id == "" || url == "" {
		return
	}
	c.mu.Lock()
	c.items[id] = audioURLCacheItem{url: url, expireAt: time.Now().Add(ttl)}
	c.mu.Unlock()
}

func decodeJSON(payload []byte) (map[string]interface{}, error) {
	var root map[string]interface{}
	decoder := json.NewDecoder(strings.NewReader(string(payload)))
	decoder.UseNumber()
	if err := decoder.Decode(&root); err != nil {
		return nil, err
	}
	return root, nil
}

func checkXimalayaRet(root map[string]interface{}) error {
	ret := pickInt(root, "ret")
	if ret != 0 && ret != 200 {
		msg := pickString(root, "msg")
		if msg == "" {
			msg = "ximalaya request failed"
		}
		return errors.New(msg)
	}
	return nil
}

func pickString(data map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if value, ok := data[key]; ok {
			switch v := value.(type) {
			case string:
				return strings.TrimSpace(v)
			case json.Number:
				return v.String()
			case float64:
				if v == float64(int64(v)) {
					return strconv.FormatInt(int64(v), 10)
				}
				return fmt.Sprintf("%v", v)
			case int:
				return strconv.Itoa(v)
			case int64:
				return strconv.FormatInt(v, 10)
			case bool:
				if v {
					return "true"
				}
				return "false"
			}
		}
	}
	return ""
}

func pickInt(data map[string]interface{}, keys ...string) int {
	for _, key := range keys {
		if value, ok := data[key]; ok {
			switch v := value.(type) {
			case int:
				return v
			case int64:
				return int(v)
			case float64:
				return int(v)
			case json.Number:
				if n, err := v.Int64(); err == nil {
					return int(n)
				}
				if n, err := v.Float64(); err == nil {
					return int(n)
				}
			case string:
				if n, err := strconv.Atoi(v); err == nil {
					return n
				}
			}
		}
	}
	return 0
}

func pickBool(data map[string]interface{}, keys ...string) bool {
	for _, key := range keys {
		if value, ok := data[key]; ok {
			switch v := value.(type) {
			case bool:
				return v
			case string:
				if v == "true" || v == "1" {
					return true
				}
			case json.Number:
				if n, err := v.Int64(); err == nil {
					return n != 0
				}
			case float64:
				return v != 0
			case int:
				return v != 0
			}
		}
	}
	return false
}

func formatStatus(data map[string]interface{}) string {
	count := pickInt(data, "tracksCount", "trackCount", "playCount", "episodeCount")
	if count <= 0 {
		return ""
	}
	return fmt.Sprintf("共 %d 集", count)
}

func pickAudioURL(data map[string]interface{}) string {
	if list, ok := data["playUrlList"].([]interface{}); ok {
		for _, item := range list {
			if itemMap, ok := item.(map[string]interface{}); ok {
				if url := pickString(itemMap, "url", "playUrl", "playUrl64", "src"); url != "" {
					return url
				}
			}
		}
	}
	if info, ok := data["playUrlInfo"].(map[string]interface{}); ok {
		if url := pickString(info, "url", "playUrl", "playUrl64"); url != "" {
			return url
		}
	}
	if info, ok := data["playUrl"].(map[string]interface{}); ok {
		if url := pickString(info, "url", "playUrl", "playUrl64"); url != "" {
			return url
		}
	}
	if info, ok := data["playUrlList"].(map[string]interface{}); ok {
		if url := pickString(info, "url", "playUrl", "playUrl64"); url != "" {
			return url
		}
	}
	if url := pickString(data, "url", "playUrl", "playUrl64", "playUrl32", "src", "audioUrl", "audio_url"); url != "" {
		return url
	}
	return ""
}

func pickTrackAudioURL(data map[string]interface{}) string {
	if url := pickString(
		data,
		"playUrl64",
		"playUrl32",
		"playPathAacv224",
		"playPathAacv164",
		"src",
		"playUrl",
	); url != "" {
		return url
	}
	return ""
}
