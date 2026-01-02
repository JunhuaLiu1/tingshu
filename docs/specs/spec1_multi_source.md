# 多平台音源爬取系统 - 技术设计文档 v2.0

## 一、概述

### 1.1 项目背景

本项目旨在构建一个统一的多平台听书资源爬取系统，通过插件化架构整合多个听书平台的资源，为用户提供统一的搜索、播放接口。

### 1.2 平台可用性分析

经过联网测试和爬取可行性分析，平台分类如下：

#### ✅ 可直接爬取（3个）

| 平台 | 域名 | 爬取方式 | 稳定性 | 说明 |
|------|------|---------|--------|------|
| 书音FM | shuyinfm.com | HTML解析 | 高 | 资源丰富，无强反爬 |
| 幻听 | huanting.cc | HTML解析 | 高 | 移动端优先 |
| 酷我畅听 | kuwo.cn | API调用 | 高 | 已实现，稳定 |

#### 🔧 需要额外开发（1个）

| 平台 | 域名 | 爬取方式 | 复杂度 | 说明 |
|------|------|---------|--------|------|
| 猫耳FM | missevan.com | API+加密破解 | 中 | 需破解authorization参数 |

#### 📚 建议增加（2个）

| 平台 | 域名 | 爬取方式 | 复杂度 | 说明 |
|------|------|---------|--------|------|
| 懒人听书 | lrts.me | 官方API | 低 | 有公开API |
| 蜻蜓FM | qtfm.cn | API+签名 | 中 | 成熟爬取方案 |

#### ❌ 暂时不可用（6个）

| 平台 | 状态 | 原因 | 处理方案 |
|------|------|------|---------|
| 听吧 | 520错误 | Cloudflare强保护 | P3:研究绕过 |
| 听书迷 | 520错误 | Cloudflare强保护 | P3:研究绕过 |
| 听书网 | 403错误 | IP封禁/访问控制 | P3:研究绕过 |
| Ting27 | 重定向 | 实际指向huanting.cc | 合并到幻听 |
| 听书168 | 空响应 | 服务器异常 | P3:联系站长 |
| 乐听8 | 520错误 | Cloudflare强保护 | P3:研究绕过 |

### 1.3 核心目标

- **统一接口**：为所有平台提供统一的搜索/详情/API接口
- **插件化架构**：每个平台独立实现，便于维护和扩展
- **高可用性**：失败率监控、自动降级、代理池支持
- **反爬应对**：TLS指纹伪装、Cookie池、User-Agent轮换
- **合规爬取**：遵守robots.txt，控制请求频率，仅爬免费内容

## 二、架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway (Gin)                           │
├─────────────────────────────────────────────────────────────────┤
│  GET  /api/v1/sources              # 获取所有可用音源              │
│  GET  /api/v1/sources/:id/search    # 搜索指定平台                 │
│  GET  /api/v1/sources/:id/detail    # 获取书籍详情                 │
│  GET  /api/v1/sources/:id/chapters  # 获取章节列表                 │
│  GET  /api/v1/sources/:id/audio     # 获取音频URL                 │
│  POST /api/v1/global/search         # 全局搜索（所有可用平台）      │
│  GET  /api/v1/sources/status        # 获取平台状态和健康检查        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Source Manager                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Register(source Source)  │  Get(id string)  │  List()    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Enable(id string)  │  Disable(id string)  │  Health()   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Ximalaya       │ │  ShuyinFM       │ │  Huanting       │
│  (已实现)       │ │  (P0开发)       │ │  (P0开发)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Kuwo           │ │  Missevan       │ │  LazyTing       │
│  (已实现)       │ │  (P1开发)       │ │  (P1开发)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     支持组件层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Proxy Pool   │  │ Cookie Pool  │  │  Monitor     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Cache        │  │ AntiCrawler  │  │  Logger      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 统一接口定义

```go
// backend/tingshu/source/interface.go

package source

// Source 音源接口
type Source interface {
    // 基本信息
    ID() string                      // 唯一标识
    Name() string                    // 平台名称
    Description() string             // 平台描述
    BaseURL() string                 // 基础URL
    Version() string                 // 版本号
    
    // 功能支持
    IsSearchable() bool              // 是否支持搜索
    HasCategories() bool             // 是否有分类
    NeedProxy() bool                 // 是否需要代理
    NeedCookie() bool                // 是否需要Cookie
    
    // 核心功能
    Search(keyword string, page int) (*SearchResult, error)
    GetCategories() ([]Category, error)
    GetBookDetail(bookID string) (*BookDetail, error)
    GetChapters(bookID string) ([]Chapter, error)
    GetAudioURL(chapterID string) (string, error)
    
    // 健康检查
    HealthCheck() HealthStatus
}

// HealthStatus 健康状态
type HealthStatus struct {
    Status      string    `json:"status"`       // healthy, degraded, down
    SuccessRate float64   `json:"success_rate"` // 成功率
    LastCheckAt time.Time `json:"last_check_at"`
    Error       string    `json:"error,omitempty"`
}

// SearchResult 搜索结果
type SearchResult struct {
    Books       []Book   `json:"books"`
    TotalPage   int      `json:"total_page"`
    CurrentPage int      `json:"current_page"`
}

// Book 书籍信息
type Book struct {
    ID          string   `json:"id"`
    Title       string   `json:"title"`
    Author      string   `json:"author"`
    Artist      string   `json:"artist"`
    CoverURL    string   `json:"cover_url"`
    Description string   `json:"description"`
    Status      string   `json:"status"`        // 连载/完结
    SourceID    string   `json:"source_id"`
    ChapterCount int     `json:"chapter_count"`
    PlayCount   int      `json:"play_count"`
    UpdatedAt   string   `json:"updated_at"`
}

// BookDetail 书籍详情
type BookDetail struct {
    Book
    Chapters   []Chapter   `json:"chapters"`
    Categories []string    `json:"categories"`
    Tags       []string    `json:"tags"`
}

// Chapter 章节信息
type Chapter struct {
    ID        string `json:"id"`
    Title     string `json:"title"`
    Index     int    `json:"index"`
    Duration  int    `json:"duration"` // 音频时长(秒)
    IsFree    bool   `json:"is_free"`
    IsVip     bool   `json:"is_vip"`
    UpdatedAt string `json:"updated_at"`
}

// Category 分类
type Category struct {
    ID        string `json:"id"`
    Name      string `json:"name"`
    Count     int    `json:"count"`
    IconURL   string `json:"icon_url"`
}
```

### 2.3 Manager实现（增强版）

```go
// backend/tingshu/source/manager.go

package source

import (
    "errors"
    "sort"
    "sync"
    "time"
)

type Manager struct {
    mu       sync.RWMutex
    sources  map[string]Source
    disabled map[string]time.Time // 禁用的源及禁用时间
    monitor  *Monitor
    proxy    *ProxyPool
    cookie   *CookiePool
}

func NewManager() *Manager {
    return &Manager{
        sources:  make(map[string]Source),
        disabled: make(map[string]time.Time),
        monitor:  NewMonitor(),
        proxy:    NewProxyPool(),
        cookie:   NewCookiePool(),
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

func (m *Manager) Get(id string) (Source, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    // 检查是否被禁用
    if disabledAt, ok := m.disabled[id]; ok {
        // 禁用超过1小时自动解禁
        if time.Since(disabledAt) > time.Hour {
            m.mu.RUnlock()
            m.mu.Lock()
            delete(m.disabled, id)
            m.mu.Unlock()
            m.mu.RLock()
        } else {
            return nil, errors.New("source is disabled")
        }
    }
    
    src, ok := m.sources[id]
    if !ok {
        return nil, errors.New("source not found")
    }
    return src, nil
}

func (m *Manager) List() []SourceInfo {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    infos := make([]SourceInfo, 0, len(m.sources))
    for _, src := range m.sources {
        info := SourceInfo{
            ID:          src.ID(),
            Name:        src.Name(),
            Description: src.Description(),
            BaseURL:     src.BaseURL(),
            Version:     src.Version(),
            Searchable:  src.IsSearchable(),
            HasCategories: src.HasCategories(),
        }
        
        // 获取健康状态
        health := src.HealthCheck()
        info.HealthStatus = health.Status
        info.SuccessRate = health.SuccessRate
        
        // 检查是否被禁用
        if _, disabled := m.disabled[src.ID()]; disabled {
            info.Enabled = false
        } else {
            info.Enabled = true
        }
        
        infos = append(infos, info)
    }
    
    sort.Slice(infos, func(i, j int) bool {
        return infos[i].ID < infos[j].ID
    })
    return infos
}

func (m *Manager) Disable(id string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.disabled[id] = time.Now()
}

func (m *Manager) Enable(id string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    delete(m.disabled, id)
}

func (m *Manager) GlobalSearch(keyword string) []Book {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    var results []Book
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    for _, src := range m.sources {
        // 跳过被禁用的源
        if _, disabled := m.disabled[src.ID()]; disabled {
            continue
        }
        
        // 跳过不支持搜索的源
        if !src.IsSearchable() {
            continue
        }
        
        wg.Add(1)
        go func(s Source) {
            defer wg.Done()
            
            result, err := s.Search(keyword, 1)
            if err != nil {
                m.monitor.RecordFail(s.ID())
                return
            }
            
            m.monitor.RecordSuccess(s.ID())
            
            mu.Lock()
            results = append(results, result.Books...)
            mu.Unlock()
        }(src)
    }
    
    wg.Wait()
    
    // 检查失败率，自动禁用高失败率源
    failedSources := m.monitor.CheckAndDisable(0.7) // 70%失败率
    for _, id := range failedSources {
        m.Disable(id)
    }
    
    return results
}

type SourceInfo struct {
    ID            string      `json:"id"`
    Name          string      `json:"name"`
    Description   string      `json:"description"`
    BaseURL       string      `json:"base_url"`
    Version       string      `json:"version"`
    Searchable    bool        `json:"searchable"`
    HasCategories bool        `json:"has_categories"`
    Enabled       bool        `json:"enabled"`
    HealthStatus  string      `json:"health_status"`
    SuccessRate   float64     `json:"success_rate"`
}
```

## 三、各平台爬取方案

### 3.1 书音FM (shuyinfm.com) - P0

**平台特点**：
- 综合性听书平台
- 网站结构简单，无强反爬
- 资源丰富，更新及时

**爬取策略**：HTML解析 + goquery

```go
// backend/tingshu/source/shuyinfm.go

type ShuyinFM struct {
    client  *http.Client
    baseURL string
}

func NewShuyinFM() *ShuyinFM {
    return &ShuyinFM{
        client:  &http.Client{
            Timeout: 15 * time.Second,
            Transport: &http.Transport{
                MaxIdleConns:    50,
                IdleConnTimeout: 90 * time.Second,
            },
        },
        baseURL: "https://m.shuyinfm.com",
    }
}

func (s *ShuyinFM) ID() string    { return "shuyinfm" }
func (s *ShuyinFM) Name() string  { return "书音FM" }
func (s *ShuyinFM) Version() string { return "1.0.0" }
func (s *ShuyinFM) Description() string { return "书音FM听书平台" }
func (s *ShuyinFM) BaseURL() string { return s.baseURL }
func (s *ShuyinFM) IsSearchable() bool { return true }
func (s *ShuyinFM) HasCategories() bool { return true }
func (s *ShuyinFM) NeedProxy() bool { return false }
func (s *ShuyinFM) NeedCookie() bool { return false }

func (s *ShuyinFM) Search(keyword string, page int) (*SearchResult, error) {
    endpoint := fmt.Sprintf(
        "%s/search?keyword=%s&page=%d",
        s.baseURL, url.QueryEscape(keyword), page,
    )
    
    html, err := doGet(s.client, endpoint, map[string]string{
        "User-Agent": GetRandomUserAgent(),
    })
    if err != nil {
        return nil, err
    }
    
    // 使用goquery解析HTML（需根据实际HTML结构调整选择器）
    doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
    if err != nil {
        return nil, err
    }
    
    var books []Book
    
    // 解析书籍列表（根据实际HTML结构调整）
    doc.Find(".book-list .book-item").Each(func(i int, sel *goquery.Selection) {
        book := Book{
            ID:          sel.AttrOr("data-id", ""),
            Title:       strings.TrimSpace(sel.Find(".title").Text()),
            Author:      strings.TrimSpace(sel.Find(".author").Text()),
            Artist:      strings.TrimSpace(sel.Find(".artist").Text()),
            CoverURL:    sel.Find("img").AttrOr("src", ""),
            Description: strings.TrimSpace(sel.Find(".desc").Text()),
            Status:      strings.TrimSpace(sel.Find(".status").Text()),
            SourceID:    s.ID(),
        }
        
        if book.ID != "" {
            books = append(books, book)
        }
    })
    
    return &SearchResult{
        Books:       books,
        TotalPage:   10, // 根据实际分页信息调整
        CurrentPage: page,
    }, nil
}

func (s *ShuyinFM) GetBookDetail(bookID string) (*BookDetail, error) {
    endpoint := fmt.Sprintf("%s/album/%s", s.baseURL, bookID)
    
    html, err := doGet(s.client, endpoint, map[string]string{
        "User-Agent": GetRandomUserAgent(),
    })
    if err != nil {
        return nil, err
    }
    
    doc, err := goquery.NewDocumentFromReader(strings.NewReader(html))
    if err != nil {
        return nil, err
    }
    
    book := Book{
        ID:          bookID,
        Title:       doc.Find(".book-title").Text(),
        Author:      doc.Find(".book-author").Text(),
        Artist:      doc.Find(".book-artist").Text(),
        CoverURL:    doc.Find(".book-cover img").AttrOr("src", ""),
        Description: doc.Find(".book-desc").Text(),
        Status:      doc.Find(".book-status").Text(),
        SourceID:    s.ID(),
    }
    
    // 解析章节列表（根据实际HTML调整）
    var chapters []Chapter
    doc.Find(".chapter-list .chapter-item").Each(func(i int, sel *goquery.Selection) {
        chapter := Chapter{
            ID:    sel.AttrOr("data-id", ""),
            Title: strings.TrimSpace(sel.Find("a").Text()),
            Index: i + 1,
            IsFree: !sel.HasClass("vip"),
        }
        chapters = append(chapters, chapter)
    })
    
    return &BookDetail{
        Book:     book,
        Chapters: chapters,
    }, nil
}

func (s *ShuyinFM) GetAudioURL(chapterID string) (string, error) {
    endpoint := fmt.Sprintf("%s/play/%s", s.baseURL, chapterID)
    
    html, err := doGet(s.client, endpoint, map[string]string{
        "User-Agent": GetRandomUserAgent(),
    })
    if err != nil {
        return "", err
    }
    
    doc, _ := goquery.NewDocumentFromReader(strings.NewReader(html))
    
    // 尝试从audio标签提取
    if audioURL := doc.Find("audio source").AttrOr("src", ""); audioURL != "" {
        return audioURL, nil
    }
    
    // 尝试从JS代码提取
    var audioURL string
    doc.Find("script").Each(func(i int, sel *goquery.Selection) {
        if audioURL == "" {
            text := sel.Text()
            if strings.Contains(text, "audio_url") || strings.Contains(text, "playUrl") {
                re := regexp.MustCompile(`['"]([^'"]*\.(mp3|m4a))['"]`)
                matches := re.FindStringSubmatch(text)
                if len(matches) > 1 {
                    audioURL = matches[1]
                }
            }
        }
    })
    
    if audioURL != "" {
        return audioURL, nil
    }
    
    return "", errors.New("audio URL not found")
}

func (s *ShuyinFM) GetChapters(bookID string) ([]Chapter, error) {
    detail, err := s.GetBookDetail(bookID)
    if err != nil {
        return nil, err
    }
    return detail.Chapters, nil
}

func (s *ShuyinFM) GetCategories() ([]Category, error) {
    endpoint := s.baseURL + "/categories"
    
    html, err := doGet(s.client, endpoint, nil)
    if err != nil {
        return nil, err
    }
    
    doc, _ := goquery.NewDocumentFromReader(strings.NewReader(html))
    
    var categories []Category
    doc.Find(".category-list .category-item").Each(func(i int, sel *goquery.Selection) {
        cat := Category{
            ID:      sel.AttrOr("data-id", ""),
            Name:    strings.TrimSpace(sel.Find(".name").Text()),
            Count:   parseInt(sel.Find(".count").Text()),
            IconURL: sel.Find("img").AttrOr("src", ""),
        }
        categories = append(categories, cat)
    })
    
    return categories, nil
}

func (s *ShuyinFM) HealthCheck() HealthStatus {
    _, err := s.client.Get(s.baseURL)
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
```

### 3.2 幻听 - P0

**爬取策略**：与书音FM类似，HTML解析方式

### 3.3 猫耳FM (missevan.com) - P1

**爬取策略**：API调用 + authorization参数破解

```go
type Missevan struct {
    client   *http.Client
    baseURL  string
    deviceID string
}

func NewMissevan() *Missevan {
    return &Missevan{
        client:   &http.Client{Timeout: 15 * time.Second},
        baseURL:  "https://app.missevan.com",
        deviceID: generateDeviceID(),
    }
}

func generateDeviceID() string {
    return fmt.Sprintf("MOBILESITE-%d", time.Now().UnixNano())
}

func (m *Missevan) generateAuthorization(timestamp int64) string {
    // 需要逆向分析猫耳FM的加密算法
    data := fmt.Sprintf("%s%d", m.deviceID, timestamp)
    hash := md5.Sum([]byte(data))
    return fmt.Sprintf("app.missevan.com:%x:%d", hash, timestamp)
}
```

### 3.4 Cloudflare绕过（P2研究目标）

**针对平台**：听吧、听书迷、乐听8

**技术方案**：
1. TLS指纹伪装
2. Cookie池管理
3. 代理轮换
4. 无头浏览器（Playwright）处理JavaScript挑战

## 四、支持组件

### 4.1 代理池

```go
// backend/tingshu/source/proxy_pool.go

package source

type ProxyPool struct {
    proxies   []Proxy
    mu        sync.RWMutex
    current   int
}

type Proxy struct {
    URL       string
    Type      string
    Success   int
    Fail      int
}

func NewProxyPool() *ProxyPool {
    return &ProxyPool{proxies: []Proxy{}}
}

func (p *ProxyPool) Get() string {
    p.mu.Lock()
    defer p.mu.Unlock()
    
    if len(p.proxies) == 0 {
        return ""
    }
    
    proxy := p.proxies[p.current]
    p.current = (p.current + 1) % len(p.proxies)
    return proxy.URL
}
```

### 4.2 监控组件

```go
// backend/tingshu/source/monitor.go

package source

type Monitor struct {
    successCount map[string]int
    failCount    map[string]int
    mu           sync.RWMutex
}

func NewMonitor() *Monitor {
    return &Monitor{
        successCount: make(map[string]int),
        failCount:    make(map[string]int),
    }
}

func (m *Monitor) RecordSuccess(sourceID string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.successCount[sourceID]++
}

func (m *Monitor) RecordFail(sourceID string) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.failCount[sourceID]++
}

func (m *Monitor) CheckAndDisable(threshold float64) []string {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    var disabled []string
    
    for sourceID := range m.failCount {
        if m.GetSuccessRate(sourceID) < threshold {
            disabled = append(disabled, sourceID)
        }
    }
    
    return disabled
}
```

### 4.3 反爬组件

```go
// backend/tingshu/source/anticrawler.go

package source

type AntiCrawler struct {
    mu          sync.Mutex
    requestLog  map[string][]time.Time
    delay       time.Duration
    maxRequests int
    window      time.Duration
    userAgents  []string
}

func NewAntiCrawler(delay time.Duration, maxRequests int, window time.Duration) *AntiCrawler {
    return &AntiCrawler{
        requestLog: make(map[string][]time.Time),
        delay:       delay,
        maxRequests: maxRequests,
        window:      window,
        userAgents: []string{
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
            "Mozilla/5.0 (Linux; Android 10)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
    }
}

func GetRandomUserAgent() string {
    agents := []string{
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
        "Mozilla/5.0 (Linux; Android 10)",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    }
    return agents[rand.Intn(len(agents))]
}
```

### 4.4 缓存机制

```go
// backend/tingshu/source/cache.go

package source

type Cache struct {
    mu       sync.RWMutex
    search   *simpleCache
    book     *simpleCache
    audio    *simpleCache
    chapters *simpleCache
    health   *simpleCache
}

func NewCache() *Cache {
    return &Cache{
        search:   newSimpleCache(5 * time.Minute),
        book:     newSimpleCache(10 * time.Minute),
        audio:    newSimpleCache(30 * time.Minute),
        chapters: newSimpleCache(10 * time.Minute),
        health:   newSimpleCache(1 * time.Minute),
    }
}

type simpleCache struct {
    mu      sync.RWMutex
    items   map[string]cacheItem
    ttl     time.Duration
    maxSize int
}

type cacheItem struct {
    value      interface{}
    expireAt   time.Time
    accessTime time.Time
}

func newSimpleCache(ttl time.Duration) *simpleCache {
    return &simpleCache{
        items:   make(map[string]cacheItem),
        ttl:     ttl,
        maxSize: 1000,
    }
}

func (c *simpleCache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    item, ok := c.items[key]
    if !ok {
        return nil, false
    }
    
    if time.Now().After(item.expireAt) {
        return nil, false
    }
    
    item.accessTime = time.Now()
    return item.value, true
}

func (c *simpleCache) Set(key string, value interface{}) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    if len(c.items) >= c.maxSize {
        c.evictLRU()
    }
    
    c.items[key] = cacheItem{
        value:      value,
        expireAt:   time.Now().Add(c.ttl),
        accessTime: time.Now(),
    }
}
```

## 五、API路由

```go
// backend/tingshu/api/v1/sources.go

package v1

var (
    sourceOnce    sync.Once
    sourceManager *source.Manager
)

func getSourceManager() *source.Manager {
    sourceOnce.Do(func() {
        sourceManager = source.NewManager()
        
        // 注册已实现的音源
        sourceManager.Register(source.NewXimalaya())
        sourceManager.Register(source.NewKuwo())
        
        // 注册P0音源
        sourceManager.Register(source.NewShuyinFM())
        sourceManager.Register(source.NewHuanting())
        
        // 注册P1音源（待完成）
        // sourceManager.Register(source.NewMissevan())
    })
    
    return sourceManager
}

// GetSources 获取所有音源
func GetSources(c *gin.Context) {
    manager := getSourceManager()
    Success(c, manager.List())
}

// GetSourcesStatus 获取音源状态
func GetSourcesStatus(c *gin.Context) {
    manager := getSourceManager()
    
    var statusList []gin.H
    for _, info := range manager.List() {
        statusList = append(statusList, gin.H{
            "id":            info.ID,
            "name":          info.Name,
            "enabled":       info.Enabled,
            "health_status": info.HealthStatus,
            "success_rate":  info.SuccessRate,
            "version":       info.Version,
        })
    }
    
    Success(c, gin.H{
        "total":   len(statusList),
        "enabled": len(manager.GetEnabledSources()),
        "sources": statusList,
    })
}

// GlobalSearch 全局搜索
func GlobalSearch(c *gin.Context) {
    manager := getSourceManager()
    query := c.Query("q")
    
    if query == "" {
        Error(c, http.StatusBadRequest, "Search query is required")
        return
    }
    
    results := manager.GlobalSearch(query)
    
    Success(c, gin.H{
        "total":   len(results),
        "results": results,
    })
}

// DisableSource 禁用音源
func DisableSource(c *gin.Context) {
    sourceID := c.Param("id")
    
    manager := getSourceManager()
    manager.Disable(sourceID)
    
    Success(c, gin.H{
        "message": "source disabled",
        "id": sourceID,
    })
}

// EnableSource 启用音源
func EnableSource(c *gin.Context) {
    sourceID := c.Param("id")
    
    manager := getSourceManager()
    manager.Enable(sourceID)
    
    Success(c, gin.H{
        "message": "source enabled",
        "id": sourceID,
    })
}
```

## 六、实现优先级

### P0 (必须实现)

| 序号 | 音源 | 预估时间 | 风险 | 说明 |
|------|------|---------|------|------|
| 1 | 书音FM | 2天 | 低 | 可直接爬取 |
| 2 | 幻听 | 2天 | 低 | 可直接爬取 |
| 3 | 酷我畅听 | 已完成 | - | 已实现 |

### P1 (重要)

| 序号 | 音源 | 预估时间 | 风险 | 说明 |
|------|------|---------|------|------|
| 4 | 懒人听书 | 1天 | 低 | 官方API |
| 5 | 猫耳FM | 3天 | 中 | 需破解加密参数 |

### P2 (研究目标)

| 序号 | 音源 | 风险 | 说明 |
|------|------|------|------|
| 6 | 听吧 | 高 | Cloudflare保护 |
| 7 | 听书迷 | 高 | Cloudflare保护 |
| 8 | 听书网 | 高 | IP封禁 |
| 9 | 乐听8 | 高 | Cloudflare保护 |

## 七、注意事项

### 7.1 合规要求

1. **遵守robots.txt**
2. **请求频率控制**：单IP每分钟不超过60次
3. **版权声明**：仅获取免费内容

### 7.2 反爬处理

1. User-Agent轮换
2. 代理池（必要时）
3. 请求间隔随机化
4. TLS指纹伪装（P2）

### 7.3 维护策略

1. **监控告警**：失败率超70%自动禁用
2. **定期巡检**：每周检查可用性
3. **灰度发布**：新规则先测试

## 八、验收标准

### 功能验收

- [ ] P0音源搜索功能正常
- [ ] 能够获取书籍详情和章节
- [ ] 能够获取可播放的音频URL
- [ ] 搜索响应时间 < 3秒
- [ ] API可用性 > 99%
- [ ] 失败音源自动降级

### 质量验收

- [ ] 代码通过 `go vet` 和 `golint`
- [ ] 每个Source有单元测试
- [ ] 文档完整

## 九、附录

### 9.1 平台信息汇总

| 平台 | 域名 | 状态 | 优先级 |
|------|------|------|--------|
| 书音FM | shuyinfm.com | ✅ 可用 | P0 |
| 幻听 | huanting.cc | ✅ 可用 | P0 |
| 酷我畅听 | kuwo.cn | ✅ 已实现 | P0 |
| 懒人听书 | lrts.me | 🔧 需开发 | P1 |
| 猫耳FM | missevan.com | 🔧 需开发 | P1 |
| 听吧 | ting78.com | ❌ 520错误 | P2 |
| 听书迷 | tingsm.com | ❌ 520错误 | P2 |
| 听书网 | ting74.org | ❌ 403错误 | P2 |
| 乐听8 | leting8.com | ❌ 520错误 | P2 |

### 9.2 参考项目

- [eprendre/tingshu](https://github.com/eprendre/tingshu)
- [colly](https://github.com/gocolly/colly)
- [goquery](https://github.com/PuerkitoBio/goquery)
- [猫耳FM破解](https://www.bilibili.com/read/cv10461708/)

---

## 变更日志

### v2.0 (2026-01-02)
- 重新评估平台可用性，9个平台仅3个可用
- 删除暂不可用的6个平台（标记为P2研究目标）
- 增加懒人听书和蜻蜓FM建议
- 添加Cloudflare绕过方案（P3）
- 增强Manager实现（自动禁用、健康检查）
- 新增支持组件：代理池、监控、Cookie池
- 完善API路由（状态监控、启用/禁用）
- 补充验收标准和性能指标

### v1.0 (初始版本)
- 基础架构设计
- 9个平台规划
- 基本爬取策略
