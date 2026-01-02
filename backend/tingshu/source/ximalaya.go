package source

import (
	"encoding/base64"
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

	frontResult, err := x.searchViaFront(keyword, page)
	if err == nil && frontResult != nil {
		return frontResult, nil
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

	return &BookDetail{
		Book: book,
	}, nil
}

func (x *Ximalaya) GetChapters(bookID string) ([]Chapter, error) {
	episodes, err := x.fetchTracks(bookID)
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

	// 新版API数据在 albumPageMainInfo 中
	mainInfo, ok := data["albumPageMainInfo"].(map[string]interface{})
	if !ok {
		// 兼容旧版
		mainInfo = data
	}

	if reason, ok := data["reason"].(string); ok && reason != "" {
		return nil, errors.New("album blocked by risk control")
	}

	book := &Book{
		ID:          bookID,
		Title:       pickString(mainInfo, "albumTitle", "title", "name"),
		Author:      pickString(mainInfo, "anchorName", "author"),
		Artist:      pickString(mainInfo, "anchorName", "announcer", "artist"),
		CoverURL:    fixCoverURL(pickString(mainInfo, "cover", "coverPath", "cover_url", "coverUrl", "coverLarge", "coverMiddle", "coverSmall")),
		Description: pickString(mainInfo, "shortIntro", "intro", "description"),
		Status:      formatStatus(mainInfo),
		SourceID:    x.ID(),
		PlayCount:   pickInt(mainInfo, "playCount", "play_count", "playsCounts", "tracksPlayCount"),
	}
	return book, nil
}

func fixCoverURL(url string) string {
	if url == "" {
		return ""
	}
	if strings.HasPrefix(url, "//") {
		return "https:" + url
	}
	return url
}

func (x *Ximalaya) fetchTracks(bookID string) ([]Episode, error) {
	pageSize := 50
	pageNum := 1
	var episodes []Episode

	for {
		// 使用移动端API，更稳定
		timestamp := time.Now().UnixMilli()
		endpoint := fmt.Sprintf("https://mobile.ximalaya.com/mobile-album/album/page/ts-%d?albumId=%s&pageId=%d&pageSize=%d&isAsc=true", timestamp, url.QueryEscape(bookID), pageNum, pageSize)

		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("User-Agent", "okhttp/3.12.1")

		resp, err := x.client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		payload, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		root, err := decodeJSON(payload)
		if err != nil {
			return nil, err
		}

		data, ok := root["data"].(map[string]interface{})
		if !ok {
			return nil, errors.New("invalid tracks response")
		}

		tracksData, ok := data["tracks"].(map[string]interface{})
		if !ok {
			return nil, errors.New("tracks data missing")
		}

		tracksRaw, ok := tracksData["list"].([]interface{})
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
			}
			if episode.ID == "" {
				continue
			}
			if !episode.IsFree {
				continue
			}
			episodes = append(episodes, episode)
		}

		maxPageId := pickInt(tracksData, "maxPageId")
		if pageNum >= maxPageId || maxPageId == 0 {
			break
		}
		pageNum++
		if pageNum > 20 {
			break
		}
	}

	return episodes, nil
}

func (x *Ximalaya) fetchAudioURL(episodeID string, quality int) (string, error) {
	// 使用移动端v1 API，返回直接可用的音频URL
	endpoint := fmt.Sprintf("https://mobile.ximalaya.com/mobile/v1/track/baseInfo?device=android&trackId=%s", url.QueryEscape(episodeID))

	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "okhttp/3.12.1")

	resp, err := x.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	root, err := decodeJSON(payload)
	if err != nil {
		return "", err
	}

	ret := pickInt(root, "ret")
	if ret != 0 {
		msg := pickString(root, "msg")
		if msg == "" {
			msg = "获取音频失败"
		}
		return "", errors.New(msg)
	}

	if pickBool(root, "isPaid") {
		return "", errors.New("该内容需要付费")
	}

	// 按优先级选择音频URL
	audioUrl := ""
	switch quality {
	case 2: // 高清
		audioUrl = pickString(root, "playPathHq")
	case 1: // 标准
		audioUrl = pickString(root, "playPathAacv164", "playUrl64")
	default: // 低质量
		audioUrl = pickString(root, "playPathAacv224", "playUrl32")
	}

	// 如果指定质量没有，尝试其他
	if audioUrl == "" {
		audioUrl = pickString(root, "playPathAacv164", "playUrl64", "playPathAacv224", "playUrl32", "playPathHq")
	}

	if audioUrl == "" {
		return "", errors.New("audio url not found")
	}

	return audioUrl, nil
}

// 解密喜马拉雅音频URL
func decryptXimalayaUrl(encrypted string) string {
	// 解密表
	o := []byte{183, 174, 108, 16, 131, 159, 250, 5, 239, 110, 193, 202, 153, 137, 251, 176, 119, 150, 47, 204, 97, 237, 1, 71, 177, 42, 88, 218, 166, 82, 87, 94, 14, 195, 69, 127, 215, 240, 225, 197, 238, 142, 123, 44, 219, 50, 190, 29, 181, 186, 169, 98, 139, 185, 152, 13, 141, 76, 6, 157, 200, 132, 182, 49, 20, 116, 136, 43, 155, 194, 101, 231, 162, 242, 151, 213, 53, 60, 26, 134, 211, 56, 28, 223, 107, 161, 199, 15, 229, 61, 96, 41, 66, 158, 254, 21, 165, 253, 103, 89, 3, 168, 40, 246, 81, 95, 58, 31, 172, 78, 99, 45, 148, 187, 222, 124, 55, 203, 235, 64, 68, 149, 180, 35, 113, 207, 118, 111, 91, 38, 247, 214, 7, 212, 209, 189, 241, 18, 115, 173, 25, 236, 121, 249, 75, 57, 216, 10, 175, 112, 234, 164, 70, 206, 198, 255, 140, 230, 12, 32, 83, 46, 245, 0, 62, 227, 72, 191, 156, 138, 248, 114, 220, 90, 84, 170, 128, 19, 24, 122, 146, 80, 39, 37, 8, 34, 22, 11, 93, 130, 63, 154, 244, 160, 144, 79, 23, 133, 92, 54, 102, 210, 65, 67, 27, 196, 201, 106, 143, 52, 74, 100, 217, 179, 48, 233, 126, 117, 184, 226, 85, 171, 167, 86, 2, 147, 17, 135, 228, 252, 105, 30, 192, 129, 178, 120, 36, 145, 51, 163, 77, 205, 73, 4, 188, 125, 232, 33, 243, 109, 224, 104, 208, 221, 59, 9}
	a := []byte{204, 53, 135, 197, 39, 73, 58, 160, 79, 24, 12, 83, 180, 250, 101, 60, 206, 30, 10, 227, 36, 95, 161, 16, 135, 150, 235, 116, 242, 116, 165, 171}

	// URL安全base64转标准base64
	encrypted = strings.ReplaceAll(encrypted, "_", "/")
	encrypted = strings.ReplaceAll(encrypted, "-", "+")

	// 添加padding
	padding := (4 - len(encrypted)%4) % 4
	for i := 0; i < padding; i++ {
		encrypted += "="
	}

	// base64解码
	encryptedData, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil || len(encryptedData) < 16 {
		return ""
	}

	// 分离数据和IV
	data := encryptedData[:len(encryptedData)-16]
	iv := encryptedData[len(encryptedData)-16:]

	// 第一步：查表替换
	decryptedData := make([]byte, len(data))
	for i := 0; i < len(data); i++ {
		decryptedData[i] = o[data[i]]
	}

	// 第二步：与IV异或（每16字节一组）
	for i := 0; i < len(decryptedData); i += 16 {
		end := i + 16
		if end > len(decryptedData) {
			end = len(decryptedData)
		}
		for j := i; j < end; j++ {
			decryptedData[j] ^= iv[j-i]
		}
	}

	// 第三步：与密钥a异或（每32字节一组）
	for i := 0; i < len(decryptedData); i += 32 {
		end := i + 32
		if end > len(decryptedData) {
			end = len(decryptedData)
		}
		for j := i; j < end; j++ {
			decryptedData[j] ^= a[j-i]
		}
	}

	return string(decryptedData)
}

func (x *Ximalaya) searchViaFront(keyword string, page int) (*SearchResult, error) {
	rows := 20
	endpoint := fmt.Sprintf("https://search.ximalaya.com/front/v1?core=album&kw=%s&page=%d&rows=%d", url.QueryEscape(keyword), page, rows)
	payload, err := x.doGet(endpoint)
	if err != nil {
		return nil, err
	}

	var resp ximalayaFrontResponse
	if err := json.Unmarshal(payload, &resp); err != nil {
		return nil, err
	}

	books := make([]Book, 0, len(resp.Response.Docs))
	for _, doc := range resp.Response.Docs {
		id := strconv.FormatInt(doc.ID, 10)
		if id == "0" {
			continue
		}
		status := ""
		if doc.Tracks > 0 {
			status = fmt.Sprintf("共 %d 集", doc.Tracks)
		}
		books = append(books, Book{
			ID:          id,
			Title:       strings.TrimSpace(doc.Title),
			Author:      strings.TrimSpace(doc.Nickname),
			Artist:      strings.TrimSpace(doc.Nickname),
			CoverURL:    strings.TrimSpace(doc.CoverPath),
			Description: strings.TrimSpace(doc.Intro),
			Status:      status,
			SourceID:    x.ID(),
			PlayCount:   int(doc.Play),
		})
	}

	totalPage := resp.Response.TotalPage
	if totalPage == 0 && resp.Response.NumFound > 0 {
		totalPage = (resp.Response.NumFound + rows - 1) / rows
	}

	return &SearchResult{
		Books:       books,
		TotalPage:   totalPage,
		CurrentPage: page,
	}, nil
}

type ximalayaFrontResponse struct {
	Response struct {
		Docs      []ximalayaFrontDoc `json:"docs"`
		NumFound  int                `json:"numFound"`
		TotalPage int                `json:"totalPage"`
	} `json:"response"`
}

type ximalayaFrontDoc struct {
	ID        int64  `json:"id"`
	Title     string `json:"title"`
	Nickname  string `json:"nickname"`
	Play      int64  `json:"play"`
	Tracks    int    `json:"tracks"`
	CoverPath string `json:"cover_path"`
	Intro     string `json:"intro"`
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

func (x *Ximalaya) Version() string {
	return "1.0.0"
}

func (x *Ximalaya) IsSearchable() bool {
	return true
}

func (x *Ximalaya) HasCategories() bool {
	return true
}

func (x *Ximalaya) NeedProxy() bool {
	return false
}

func (x *Ximalaya) NeedCookie() bool {
	return false
}

func (x *Ximalaya) GetCategories() ([]Category, error) {
	return []Category{
		{ID: "xuanhuan", Name: "玄幻", Count: 0},
		{ID: "dushi", Name: "都市", Count: 0},
		{ID: "jishi", Name: "纪实", Count: 0},
	}, nil
}

func (x *Ximalaya) HealthCheck() HealthStatus {
	_, err := x.client.Get(x.baseURL)
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
