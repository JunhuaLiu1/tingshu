# 多平台音源爬取系统 - 技术设计文档

## 一、概述

### 1.1 项目背景

本项目旨在构建一个统一的多平台听书资源爬取系统，整合以下9个听书平台的资源：

**听书资源（9个）**：
- 书音FM (shuyinfm.com) - 综合性听书平台
- 幻听 (huanting.cc) - 有声小说平台
- 听吧 (ting78.com) - 有声资源聚合
- 听书迷 (tingsm.com) - 听书导航
- 听书网 (ting74.org) - 有声小说
- Ting27 (Ting27.com) - 听书平台
- 听书168 (tingshu168.com) - 有声小说
- 乐听8 (leting8.com) - 听书平台
- 猫耳FM (missevan.com) - 二次元音频社区

### 1.2 核心目标

- **统一接口**：为所有平台提供统一的搜索/详情/API接口
- **插件化架构**：每个平台独立实现，便于维护和扩展
- **自动化爬取**：定期更新资源，保持数据新鲜度
- **合规爬取**：遵守robots.txt，控制请求频率

## 二、架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (Gin)                         │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/sources           # 获取所有可用音源                    │
│  /api/v1/sources/:id/search # 搜索指定平台                       │
│  /api/v1/sources/:id/detail # 获取书籍详情                       │
│  /api/v1/sources/:id/audio  # 获取音频URL                   │
│  /api/v1/sources/:id/chapters # 获取章节列表                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Source Manager                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Register(source Source)  │  Get(id string)  │  List()    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Ximalaya       │ │  ShuyinFM       │ │  Huanting       │
│  (已实现)       │ │  (待实现)       │ │  (待实现)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Kuwo           │ │  Missevan       │ │  Ting78         │
│  (已实现)       │ │  (待实现)       │ │  (待实现)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2.2 统一接口定义

```go
// backend/tingshu/source/interface.go

package source

type Source interface {
    ID() string                           // 唯一标识
    Name() string                         // 平台名称
    Description() string                  // 平台描述
    BaseURL() string                      // 基础URL
    
    IsSearchable() bool                   // 是否支持搜索
    HasCategories() bool                  // 是否有分类
    NeedLogin() bool                      // 是否需要登录
    
    Search(keyword string, page int) (*SearchResult, error)
    GetCategories() ([]Category, error)
    GetBookDetail(bookID string) (*BookDetail, error)
    GetChapters(bookID string) ([]Chapter, error)
    GetAudioURL(chapterID string) (string, error)
}

type SearchResult struct {
    Books      []Book       `json:"books"`
    TotalPage  int          `json:"total_page"`
    CurrentPage int         `json:"current_page"`
}

type Book struct {
    ID          string      `json:"id"`
    Title       string      `json:"title"`
    Author      string      `json:"author"`
    Artist      string      `json:"artist"`
    CoverURL    string      `json:"cover_url"`
    Description string      `json:"description"`
    Status      string      `json:"status"`
    SourceID    string      `json:"source_id"`
    ChapterCount int        `json:"chapter_count"`
    PlayCount   int         `json:"play_count"`
}

type BookDetail struct {
    Book
    Chapters   []Chapter   `json:"chapters"`
    Categories []string    `json:"categories"`
    Tags       []string    `json:"tags"`
}

type Chapter struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    Index     int       `json:"index"`
    Duration  int       `json:"duration"`
    IsFree    bool      `json:"is_free"`
    IsVip     bool      `json:"is_vip"`
}

type Category struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Count     int       `json:"count"`
}
```

### 2.3 Manager实现

```go
// backend/tingshu/source/manager.go

package source

import (
    "errors"
    "sort"
    "sync"
)

type Manager struct {
    mu      sync.RWMutex
    sources map[string]Source
}

func NewManager() *Manager {
    return &Manager{
        sources: make(map[string]Source),
    }
}

func (m *Manager) Register(src Source) error {
    if src == nil {
        return errors.New("source is nil")
    }
    id := src.ID()
    if id == "" {
        return errors.New("source id is empty")
    }
    
    m.mu.Lock()
    defer m.mu.Unlock()
    if _, exists := m.sources[id]; exists {
        return errors.New("source already registered")
    }
    m.sources[id] = src
    return nil
}

func (m *Manager) Get(id string) (Source, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    src, ok := m.sources[id]
    return src, ok
}

func (m *Manager) List() []SourceInfo {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    infos := make([]SourceInfo, 0, len(m.sources))
    for _, src := range m.sources {
        infos = append(infos, SourceInfo{
            ID:          src.ID(),
            Name:        src.Name(),
            Description: src.Description(),
            BaseURL:     src.BaseURL(),
        })
    }
    
    sort.Slice(infos, func(i, j int) bool {
        return infos[i].ID < infos[j].ID
    })
    return infos
}

type SourceInfo struct {
    ID          string     `json:"id"`
    Name        string     `json:"name"`
    Description string     `json:"description"`
    BaseURL     string     `json:"base_url"`
}
```

## 三、各平台爬取方案

### 3.1 书音FM (shuyinfm.com)

**平台特点**：
- 综合性听书平台
- 有PC端和移动端
- 提供分类导航

**爬取策略**：

```go
// backend/tingshu/source/shuyinfm.go

type ShuyinFM struct {
    client  *http.Client
    baseURL string
}

func NewShuyinFM() *ShuyinFM {
    return &ShuyinFM{
        client:  &http.Client{Timeout: 15 * time.Second},
        baseURL: "https://m.shuyinfm.com",
    }
}

func (s *ShuyinFM) ID() string   { return "shuyinfm" }
func (s *ShuyinFM) Name() string { return "书音FM" }
func (s *ShuyinFM) Description() string { return "书音FM听书平台" }
func (s *ShuyinFM) BaseURL() string { return s.baseURL }

func (s *ShuyinFM) Search(keyword string, page int) (*SearchResult, error) {
    endpoint := fmt.Sprintf(
        "%s/search?keyword=%s&page=%d",
        s.baseURL, url.QueryEscape(keyword), page,
    )
    
    req, _ := http.NewRequest(http.MethodGet, endpoint, nil)
    req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")
    
    resp, err := s.client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    // 解析HTML或JSON
    // ...
    
    return &SearchResult{
        Books:       books,
        TotalPage:   totalPage,
        CurrentPage: page,
    }, nil
}

func (s *ShuyinFM) GetBookDetail(bookID string) (*BookDetail, error) {
    endpoint := fmt.Sprintf("%s/album/%s", s.baseURL, bookID)
    
    // 解析HTML获取：
    // - 书籍标题、作者、播讲人
    // - 封面图片
    // - 章节列表
    // ...
}

func (s *ShuyinFM) GetAudioURL(chapterID string) (string, error) {
    endpoint := fmt.Sprintf("%s/play/%s", s.baseURL, chapterID)
    
    // 提取音频URL
    // ...
}
```

### 3.2 幻听 (huanting.cc)

**平台特点**：
- 有声小说平台
- 移动端优先
- 资源丰富

```go
func (h *Huanting) Search(keyword string, page int) (*SearchResult, error) {
    endpoint := fmt.Sprintf(
        "%s/search?q=%s&p=%d",
        h.baseURL, url.QueryEscape(keyword), page,
    )
    
    // 尝试API获取JSON
    // 失败则解析HTML
}
```

### 3.3 猫耳FM (missevan.com)

**平台特点**：
- 二次元音频社区
- 广播剧、有声漫画为主
- 有官方API

```go
func (m *Missevan) Search(keyword string, page int) (*SearchResult, error) {
    endpoint := fmt.Sprintf(
        "https://missevan.com/api/sound/search?keyword=%s&page=%d",
        url.QueryEscape(keyword), page,
    )
    
    resp, err := m.client.Get(endpoint)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result missevanSearchResponse
    json.NewDecoder(resp.Body).Decode(&result)
    // 解析结果
}
```

## 四、通用工具函数

### 4.1 HTTP客户端封装

```go
// backend/tingshu/source/client.go

package source

import (
    "crypto/tls"
    "io"
    "net/http"
    "time"
)

type HTTPClient struct {
    client *http.Client
}

func NewHTTPClient() *HTTPClient {
    return &HTTPClient{
        client: &http.Client{
            Timeout: 15 * time.Second,
            Transport: &http.Transport{
                TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
                MaxIdleConns:    100,
                IdleConnTimeout: 90 * time.Second,
            },
        },
    }
}

func (c *HTTPClient) Get(url string, headers map[string]string) ([]byte, error) {
    req, err := http.NewRequest(http.MethodGet, url, nil)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)")
    req.Header.Set("Accept", "text/html,application/xhtml+xml")
    req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9")
    
    for k, v := range headers {
        req.Header.Set(k, v)
    }
    
    resp, err := c.client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    return io.ReadAll(resp.Body)
}
```

### 4.2 HTML解析器

```go
// backend/tingshu/source/parser.go

package source

import (
    "strings"
    
    "github.com/PuerkitoBio/goquery"
)

type HTMLParser struct{}

func NewHTMLParser() *HTMLParser {
    return &HTMLParser{}
}

func (p *HTMLParser) ParseBookList(html string, selector string) []Book {
    doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
    if err != nil {
        return nil
    }
    
    var books []Book
    doc.Find(selector).Each(func(i int, s *goquery.Selection) {
        book := Book{
            ID:       p.extractID(s),
            Title:    strings.TrimSpace(s.Find(".title").Text()),
            Author:   strings.TrimSpace(s.Find(".author").Text()),
            CoverURL: s.Find("img").AttrOr("src", ""),
        }
        books = append(books, book)
    })
    
    return books
}

func (p *HTMLParser) ParseChapterList(html string, selector string) []Chapter {
    doc, _ := goquery.NewDocumentFromReader(strings.NewReader(html))
    
    var chapters []Chapter
    doc.Find(selector).Each(func(i int, s *goquery.Selection) {
        chapter := Chapter{
            ID:    s.AttrOr("data-id", ""),
            Title: strings.TrimSpace(s.Find("a").Text()),
            Index: i + 1,
        }
        chapters = append(chapters, chapter)
    })
    
    return chapters
}

func (p *HTMLParser) extractID(s *goquery.Selection) string {
    if id, exists := s.Attr("data-id"); exists {
        return id
    }
    if href, exists := s.Attr("href"); exists {
        parts := strings.Split(href, "/")
        return parts[len(parts)-1]
    }
    return ""
}

func (p *HTMLParser) ExtractAudioURL(html string) string {
    doc, _ := goquery.NewDocumentFromReader(strings.NewReader(html))
    
    if audioSrc := doc.Find("audio source").AttrOr("src", ""); audioSrc != "" {
        return audioSrc
    }
    
    return ""
}
```

### 4.3 反爬处理

```go
// backend/tingshu/source/anticrawler.go

package source

import (
    "math/rand"
    "sync"
    "time"
)

type AntiCrawler struct {
    mu          sync.Mutex
    requestLog  map[string][]time.Time
    delay       time.Duration
    maxRequests int
    window      time.Duration
}

func NewAntiCrawler(delay time.Duration, maxRequests int, window time.Duration) *AntiCrawler {
    return &AntiCrawler{
        requestLog:  make(map[string][]time.Time),
        delay:       delay,
        maxRequests: maxRequests,
        window:      window,
    }
}

func (a *AntiCrawler) ShouldWait(clientIP string) bool {
    a.mu.Lock()
    defer a.mu.Unlock()
    
    now := time.Now()
    
    if times, ok := a.requestLog[clientIP]; ok {
        var validTimes []time.Time
        for _, t := range times {
            if now.Sub(t) < a.window {
                validTimes = append(validTimes, t)
            }
        }
        a.requestLog[clientIP] = validTimes
        
        if len(validTimes) >= a.maxRequests {
            return true
        }
    }
    
    a.requestLog[clientIP] = append(a.requestLog[clientIP], now)
    return false
}

func (a *AntiCrawler) RandomDelay() {
    delay := a.delay + time.Duration(rand.Intn(5000))*time.Millisecond
    time.Sleep(delay)
}

func GetRandomUserAgent() string {
    agents := []string{
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
        "Mozilla/5.0 (Linux; Android 10)",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    }
    return agents[rand.Intn(len(agents))]
}
```

## 五、缓存机制

```go
// backend/tingshu/source/cache.go

package source

import (
    "sync"
    "time"
)

type Cache struct {
    mu       sync.RWMutex
    search   *simpleCache
    book     *simpleCache
    audio    *simpleCache
    chapters *simpleCache
}

func NewCache() *Cache {
    return &Cache{
        search:   newSimpleCache(5 * time.Minute),
        book:     newSimpleCache(10 * time.Minute),
        audio:    newSimpleCache(30 * time.Minute),
        chapters: newSimpleCache(10 * time.Minute),
    }
}

type simpleCache struct {
    mu      sync.RWMutex
    items   map[string]cacheItem
    ttl     time.Duration
}

type cacheItem struct {
    value    interface{}
    expireAt time.Time
}

func newSimpleCache(ttl time.Duration) *simpleCache {
    return &simpleCache{
        items: make(map[string]cacheItem),
        ttl:   ttl,
    }
}

func (c *simpleCache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    item, ok := c.items[key]
    c.mu.RUnlock()
    
    if !ok {
        return nil, false
    }
    
    if time.Now().After(item.expireAt) {
        c.mu.Lock()
        delete(c.items, key)
        c.mu.Unlock()
        return nil, false
    }
    
    return item.value, true
}

func (c *simpleCache) Set(key string, value interface{}) {
    c.mu.Lock()
    c.items[key] = cacheItem{
        value:    value,
        expireAt: time.Now().Add(c.ttl),
    }
    c.mu.Unlock()
}
```

## 六、API路由

```go
// backend/tingshu/api/v1/sources.go

func GetSources(c *gin.Context) {
    manager := getSourceManager()
    Success(c, manager.List())
}

func SearchSource(c *gin.Context) {
    sourceID := c.Param("id")
    query := c.Query("q")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    
    if query == "" {
        Error(c, http.StatusBadRequest, "Search query is required")
        return
    }
    
    manager := getSourceManager()
    src, ok := manager.Get(sourceID)
    if !ok {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    result, err := src.Search(query, page)
    if err != nil {
        Error(c, http.StatusBadGateway, err.Error())
        return
    }
    
    Success(c, result)
}

func GetSourceBookDetail(c *gin.Context) {
    sourceID := c.Param("id")
    bookID := c.Param("bookId")
    
    manager := getSourceManager()
    src, ok := manager.Get(sourceID)
    if !ok {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    detail, err := src.GetBookDetail(bookID)
    if err != nil {
        Error(c, http.StatusBadGateway, err.Error())
        return
    }
    
    Success(c, detail)
}

func GetSourceAudio(c *gin.Context) {
    sourceID := c.Param("id")
    chapterID := c.Param("chapterId")
    
    manager := getSourceManager()
    src, ok := manager.Get(sourceID)
    if !ok {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    audioURL, err := src.GetAudioURL(chapterID)
    if err != nil {
        Error(c, http.StatusBadGateway, err.Error())
        return
    }
    
    Success(c, gin.H{"audio_url": audioURL})
}
```

## 七、实现优先级

### P0 (必须实现)

| 序号 | 音源 | 原因 |
|------|------|------|
| 1 | 书音FM | 资源丰富，稳定可用 |
| 2 | 幻听 | 资源丰富 |
| 3 | 猫耳FM | 二次元内容独特 |
| 4 | 听吧 | 资源聚合 |

### P1 (重要)

| 序号 | 音源 | 原因 |
|------|------|------|
| 5 | 听书迷 | 导航站点 |
| 6 | 听书网 | 资源多 |
| 7 | Ting27 | 简单稳定 |
| 8 | 听书168 | 资源多 |

### P2 (增强)

| 序号 | 音源 | 原因 |
|------|------|------|
| 9 | 乐听8 | 补充资源 |

## 八、注意事项

### 8.1 合规要求

1. **遵守robots.txt**
2. **请求频率控制**：单IP每分钟不超过60次，间隔不少于1秒
3. **版权声明**：仅获取免费内容，明确告知来源

### 8.2 反爬处理

1. User-Agent轮换
2. IP代理池（如需要）
3. 请求间隔随机化
4. JavaScript渲染处理（如需要）

### 8.3 维护策略

1. 监控告警：API失败率超过10%时告警
2. 定期巡检：每周检查各平台可用性
3. 灰度发布：新解析规则先小范围测试

## 九、验收标准

### 功能验收

- [ ] 能够从所有9个听书平台搜索到内容
- [ ] 能够获取书籍详情和章节列表
- [ ] 能够获取可播放的音频URL
- [ ] 搜索响应时间 < 3秒
- [ ] API可用性 > 99%

### 质量验收

- [ ] 代码通过 go vet 和 golint
- [ ] 每个Source有单元测试
- [ ] 文档完整

## 十、附录

### 10.1 各平台信息汇总

| 平台 | 域名 | 类型 | 特点 |
|------|------|------|------|
| 书音FM | shuyinfm.com | 听书 | 资源丰富 |
| 幻听 | huanting.cc | 听书 | 移动端优先 |
| 听吧 | ting78.com | 听书 | 资源聚合 |
| 听书迷 | tingsm.com | 听书 | 导航站点 |
| 听书网 | ting74.org | 听书 | 资源多 |
| Ting27 | Ting27.com | 听书 | 简单稳定 |
| 听书168 | tingshu168.com | 听书 | 资源多 |
| 乐听8 | leting8.com | 听书 | 补充资源 |
| 猫耳FM | missevan.com | 听书 | 二次元 |

### 10.2 参考项目

- [eprendre/tingshu](https://github.com/eprendre/tingshu) - Android听书应用
- [colly](https://github.com/gocolly/colly) - Go爬虫框架
- [goquery](https://github.com/PuerkitoBio/goquery) - jQuery风格HTML解析
