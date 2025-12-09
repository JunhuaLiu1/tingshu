# 听书应用音源获取方案

## 一、参考项目分析

### 1.1 Ximalaya-Downloader 项目分析

**项目地址**: https://github.com/Diaoxiaozhang/Ximalaya-Downloader

**技术栈**: Python + Selenium + aiohttp

**核心原理**:
1. **喜马拉雅 API 逆向**: 通过分析喜马拉雅网页端 API，获取音频信息
2. **URL 解密**: 喜马拉雅返回的音频 URL 是加密的，需要解密算法还原真实地址
3. **Cookie 认证**: 通过 Selenium 模拟登录获取 Cookie，用于访问 VIP/付费内容
4. **签名机制**: 请求需要携带 `xm-sign` 头，格式为 `{bid}&&{sid}`

**关键 API 端点**:
```
# 获取专辑信息
GET https://www.ximalaya.com/revision/album/v1/getTracksList?albumId={id}&pageNum=1&pageSize=100

# 获取音频播放地址
GET https://www.ximalaya.com/mobile-playpage/track/v3/baseInfo/{timestamp}?device=www2&trackId={id}&trackQualityLevel=2

# 判断专辑类型(免费/付费)
GET https://www.ximalaya.com/revision/album/v1/simple?albumId={id}
```

**URL 解密算法**: 使用自定义的字节替换 + XOR 解密

**限制**:
- 每日下载数量有限制
- 需要登录才能下载 VIP 内容
- 依赖浏览器驱动

---

### 1.2 eprendre/tingshu 项目分析

**项目地址**: https://github.com/eprendre/tingshu

**技术栈**: Kotlin/Java (Android) + Jsoup + Fuel

**核心架构 - 插件化音源系统**:

```
TingShu (抽象基类)
├── getSourceId()      # 源唯一标识
├── getUrl()           # 源网站地址
├── getName()          # 源名称
├── search()           # 搜索功能
├── getCategoryMenus() # 分类菜单
├── getCategoryList()  # 分类列表
├── getBookDetailInfo()# 书籍详情+章节列表
└── getAudioUrlExtractor() # 音频URL提取器
```

**音频提取器类型**:
1. `AudioUrlDirectExtractor` - 直接返回音频URL
2. `AudioUrlJsonExtractor` - 从JSON响应提取
3. `AudioUrlJsoupExtractor` - 从HTML解析提取
4. `AudioUrlWebViewExtractor` - WebView执行JS提取
5. `AudioUrlWebViewSniffExtractor` - WebView嗅探音频请求

**已实现的音源** (30+个):
- 酷我畅听 (KuWo) - 免费，API直接返回音频URL
- 懒人听书 (LanRenTingShu) - 需登录VIP
- 爱听书 (AiTingShu) - 网页解析
- B站 (BiliBili) - 视频音频提取
- 央视 (CCTV) - 官方API
- LibriVox - 公版有声书
- 以及更多小众听书网站...

---

## 二、音源获取方案

### 方案一：免费公开音源聚合 (推荐首选)

**适用场景**: 合法合规，无版权风险

#### 2.1.1 LibriVox 公版有声书

LibriVox 提供完全免费的公版有声书，无版权问题。

**API 示例**:
```go
// 搜索
GET https://librivox.org/api/feed/audiobooks?title={keyword}&format=json

// 获取书籍详情
GET https://librivox.org/api/feed/audiobooks?id={id}&format=json
```

**响应结构**:
```json
{
  "books": [{
    "id": "123",
    "title": "书名",
    "authors": [{"first_name": "名", "last_name": "姓"}],
    "url_librivox": "https://librivox.org/...",
    "url_rss": "https://librivox.org/rss/123",
    "sections": [{
      "title": "第一章",
      "listen_url": "https://www.archive.org/download/xxx.mp3"
    }]
  }]
}
```

#### 2.1.2 Internet Archive 音频资源

Archive.org 有大量公版音频资源。

```go
// 搜索音频
GET https://archive.org/advancedsearch.php?q={keyword}+mediatype:audio&output=json

// 获取文件列表
GET https://archive.org/metadata/{identifier}
```

#### 2.1.3 喜马拉雅免费内容

喜马拉雅有大量免费内容可以合法获取。

```go
// 搜索 (无需登录)
GET https://www.ximalaya.com/revision/search/main?kw={keyword}&page=1&spellchecker=true

// 获取免费专辑章节
GET https://www.ximalaya.com/revision/album/v1/getTracksList?albumId={id}&pageNum=1&pageSize=100
```

---

### 方案二：网页爬虫解析 (中等复杂度)

**适用场景**: 小众听书网站，内容相对稳定

#### 2.2.1 通用爬虫架构

```go
// backend/tingshu/scraper/scraper.go

package scraper

import (
    "github.com/gocolly/colly/v2"
)

type AudioSource interface {
    GetID() string
    GetName() string
    Search(keyword string, page int) ([]Book, int, error)
    GetBookDetail(bookURL string) (*BookDetail, error)
    GetAudioURL(episodeURL string) (string, error)
}

type Book struct {
    ID       string `json:"id"`
    Title    string `json:"title"`
    Author   string `json:"author"`
    Artist   string `json:"artist"`
    CoverURL string `json:"cover_url"`
    BookURL  string `json:"book_url"`
    Status   string `json:"status"`
    Intro    string `json:"intro"`
}

type Episode struct {
    Title    string `json:"title"`
    URL      string `json:"url"`
    Duration int    `json:"duration"`
}

type BookDetail struct {
    Episodes []Episode `json:"episodes"`
    Intro    string    `json:"intro"`
}
```

#### 2.2.2 示例：爱听书源实现

```go
// backend/tingshu/scraper/sources/aitingshu.go

package sources

import (
    "github.com/gocolly/colly/v2"
    "strings"
)

type AiTingShu struct {
    baseURL string
}

func NewAiTingShu() *AiTingShu {
    return &AiTingShu{
        baseURL: "https://www.2uxs.com",
    }
}

func (s *AiTingShu) GetID() string {
    return "aitingshu"
}

func (s *AiTingShu) GetName() string {
    return "爱听书"
}

func (s *AiTingShu) Search(keyword string, page int) ([]Book, int, error) {
    var books []Book
    
    c := colly.NewCollector()
    
    c.OnHTML(".list-works li", func(e *colly.HTMLElement) {
        book := Book{
            CoverURL: e.ChildAttr(".list-imgbox img", "data-original"),
            Title:    e.ChildText(".list-book-dt a"),
            BookURL:  e.ChildAttr(".list-book-dt a", "href"),
            Intro:    e.ChildText(".list-book-des"),
        }
        books = append(books, book)
    })
    
    c.Post(s.baseURL+"/novelsearch/search/result.html", map[string]string{
        "searchtype": "novelname",
        "searchword": keyword,
    })
    
    return books, 1, nil
}

func (s *AiTingShu) GetBookDetail(bookURL string) (*BookDetail, error) {
    var detail BookDetail
    
    c := colly.NewCollector()
    
    c.OnHTML("#playlist > ul > li > a", func(e *colly.HTMLElement) {
        episode := Episode{
            Title: e.Text,
            URL:   e.Attr("href"),
        }
        detail.Episodes = append(detail.Episodes, episode)
    })
    
    c.OnHTML(".book-des", func(e *colly.HTMLElement) {
        detail.Intro = strings.TrimSpace(e.Text)
    })
    
    c.Visit(bookURL)
    
    return &detail, nil
}
```

---

### 方案三：第三方 API 集成 (最简单)

**适用场景**: 快速上线，稳定可靠

#### 2.3.1 酷我畅听 API

酷我畅听提供相对稳定的 API，无需复杂认证。

```go
// backend/tingshu/scraper/sources/kuwo.go

package sources

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
)

type KuWo struct{}

func (k *KuWo) GetID() string { return "kuwo" }
func (k *KuWo) GetName() string { return "酷我畅听" }

func (k *KuWo) Search(keyword string, page int) ([]Book, int, error) {
    encoded := url.QueryEscape(keyword)
    apiURL := fmt.Sprintf(
        "http://baby.kuwo.cn/tingshu/api/search/Search?rn=10&type=album&version=8.5.6.1&wd=%s&pn=%d",
        encoded, page,
    )
    
    resp, err := http.Get(apiURL)
    if err != nil {
        return nil, 0, err
    }
    defer resp.Body.Close()
    
    var result struct {
        Data struct {
            Total int `json:"total"`
            Data  []struct {
                AlbumID    int    `json:"albumId"`
                AlbumName  string `json:"albumName"`
                CoverImg   string `json:"coverImg"`
                ArtistName string `json:"artistName"`
                SongTotal  int    `json:"songTotal"`
                Title      string `json:"title"`
            } `json:"data"`
        } `json:"data"`
    }
    
    json.NewDecoder(resp.Body).Decode(&result)
    
    var books []Book
    for _, item := range result.Data.Data {
        books = append(books, Book{
            ID:       fmt.Sprintf("%d", item.AlbumID),
            Title:    item.AlbumName,
            CoverURL: item.CoverImg,
            Artist:   item.ArtistName,
            Status:   fmt.Sprintf("共 %d 章", item.SongTotal),
            Intro:    item.Title,
            BookURL:  fmt.Sprintf("kuwo://%d", item.AlbumID),
        })
    }
    
    totalPage := (result.Data.Total + 9) / 10
    return books, totalPage, nil
}

func (k *KuWo) GetBookDetail(bookURL string) (*BookDetail, error) {
    // 从 bookURL 提取 albumId
    var albumID string
    fmt.Sscanf(bookURL, "kuwo://%s", &albumID)
    
    apiURL := fmt.Sprintf(
        "http://baby.kuwo.cn/tingshu/api/data/album/songs?albumId=%s&online=0",
        albumID,
    )
    
    resp, err := http.Get(apiURL)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result struct {
        Data []struct {
            Name     string `json:"name"`
            Musicrid string `json:"musicrid"`
        } `json:"data"`
    }
    
    json.NewDecoder(resp.Body).Decode(&result)
    
    var detail BookDetail
    for _, item := range result.Data {
        // 酷我音频直链格式
        audioURL := fmt.Sprintf(
            "http://antiserver.kuwo.cn/anti.s?format=mp3&rid=MUSIC_%s&response=res&type=convert_url",
            item.Musicrid,
        )
        detail.Episodes = append(detail.Episodes, Episode{
            Title: item.Name,
            URL:   audioURL,
        })
    }
    
    return &detail, nil
}
```

---

## 三、推荐实施方案

### 3.1 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    EtherAudio 后端                       │
├─────────────────────────────────────────────────────────┤
│  API Layer (Gin)                                        │
│  ├── /api/v1/sources          # 获取可用音源列表         │
│  ├── /api/v1/sources/:id/search  # 搜索指定音源         │
│  ├── /api/v1/sources/:id/categories  # 获取分类         │
│  ├── /api/v1/sources/:id/books/:bookId  # 书籍详情      │
│  └── /api/v1/sources/:id/audio/:episodeId  # 音频URL    │
├─────────────────────────────────────────────────────────┤
│  Source Manager                                         │
│  ├── RegisterSource(source AudioSource)                 │
│  ├── GetSource(id string) AudioSource                   │
│  ├── ListSources() []SourceInfo                         │
│  └── SearchAll(keyword string) []Book                   │
├─────────────────────────────────────────────────────────┤
│  Audio Sources (插件化)                                  │
│  ├── LibriVox (公版书)                                   │
│  ├── KuWo (酷我畅听)                                     │
│  ├── AiTingShu (爱听书)                                  │
│  └── ... 更多音源                                        │
└─────────────────────────────────────────────────────────┘
```


### 3.2 数据库设计扩展

```sql
-- 音源配置表
CREATE TABLE audio_sources (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_url VARCHAR(255),
    is_enabled BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 外部书籍缓存表 (缓存从外部源获取的书籍信息)
CREATE TABLE external_books (
    id SERIAL PRIMARY KEY,
    source_id VARCHAR(50) NOT NULL,
    external_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100),
    artist VARCHAR(100),
    cover_url TEXT,
    description TEXT,
    status VARCHAR(50),
    book_url TEXT,
    episodes_count INT DEFAULT 0,
    cached_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_id, external_id)
);

-- 外部章节缓存表
CREATE TABLE external_episodes (
    id SERIAL PRIMARY KEY,
    external_book_id INT REFERENCES external_books(id),
    episode_num INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    audio_url TEXT,
    duration INT,
    cached_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_external_books_source ON external_books(source_id);
CREATE INDEX idx_external_books_title ON external_books(title);
CREATE INDEX idx_external_episodes_book ON external_episodes(external_book_id);
```

### 3.3 后端代码实现

#### 3.3.1 音源接口定义

```go
// backend/tingshu/scraper/interface.go

package scraper

// AudioSource 音源接口
type AudioSource interface {
    // 基本信息
    GetID() string
    GetName() string
    GetDescription() string
    GetBaseURL() string
    
    // 功能支持
    IsSearchable() bool
    HasCategories() bool
    
    // 核心功能
    Search(keyword string, page int) (*SearchResult, error)
    GetCategories() ([]Category, error)
    GetCategoryBooks(categoryID string, page int) (*SearchResult, error)
    GetBookDetail(bookID string) (*BookDetail, error)
    GetAudioURL(episodeURL string) (string, error)
}

// SearchResult 搜索结果
type SearchResult struct {
    Books      []Book `json:"books"`
    TotalPage  int    `json:"total_page"`
    CurrentPage int   `json:"current_page"`
}

// Book 书籍信息
type Book struct {
    ID          string `json:"id"`
    Title       string `json:"title"`
    Author      string `json:"author"`
    Artist      string `json:"artist"`
    CoverURL    string `json:"cover_url"`
    Description string `json:"description"`
    Status      string `json:"status"`
    SourceID    string `json:"source_id"`
}

// BookDetail 书籍详情
type BookDetail struct {
    Book
    Episodes []Episode `json:"episodes"`
}

// Episode 章节信息
type Episode struct {
    ID       string `json:"id"`
    Title    string `json:"title"`
    URL      string `json:"url"`
    Duration int    `json:"duration"`
    IsFree   bool   `json:"is_free"`
}

// Category 分类
type Category struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}
```

#### 3.3.2 音源管理器

```go
// backend/tingshu/scraper/manager.go

package scraper

import (
    "errors"
    "sync"
)

var (
    ErrSourceNotFound = errors.New("audio source not found")
)

// Manager 音源管理器
type Manager struct {
    sources map[string]AudioSource
    mu      sync.RWMutex
}

// NewManager 创建管理器
func NewManager() *Manager {
    return &Manager{
        sources: make(map[string]AudioSource),
    }
}

// Register 注册音源
func (m *Manager) Register(source AudioSource) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.sources[source.GetID()] = source
}

// Get 获取音源
func (m *Manager) Get(id string) (AudioSource, error) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    source, ok := m.sources[id]
    if !ok {
        return nil, ErrSourceNotFound
    }
    return source, nil
}

// List 列出所有音源
func (m *Manager) List() []SourceInfo {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    var list []SourceInfo
    for _, source := range m.sources {
        list = append(list, SourceInfo{
            ID:          source.GetID(),
            Name:        source.GetName(),
            Description: source.GetDescription(),
            Searchable:  source.IsSearchable(),
            HasCategories: source.HasCategories(),
        })
    }
    return list
}

// SourceInfo 音源信息
type SourceInfo struct {
    ID            string `json:"id"`
    Name          string `json:"name"`
    Description   string `json:"description"`
    Searchable    bool   `json:"searchable"`
    HasCategories bool   `json:"has_categories"`
}

// SearchAll 全局搜索
func (m *Manager) SearchAll(keyword string) []Book {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    var allBooks []Book
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    for _, source := range m.sources {
        if !source.IsSearchable() {
            continue
        }
        
        wg.Add(1)
        go func(s AudioSource) {
            defer wg.Done()
            result, err := s.Search(keyword, 1)
            if err != nil {
                return
            }
            
            mu.Lock()
            allBooks = append(allBooks, result.Books...)
            mu.Unlock()
        }(source)
    }
    
    wg.Wait()
    return allBooks
}
```

#### 3.3.3 API 路由

```go
// backend/tingshu/api/v1/sources.go

package v1

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    "your-project/tingshu/scraper"
)

var sourceManager *scraper.Manager

func InitSourceManager() {
    sourceManager = scraper.NewManager()
    
    // 注册音源
    sourceManager.Register(sources.NewKuWo())
    sourceManager.Register(sources.NewLibriVox())
    // 添加更多音源...
}

// GetSources 获取所有音源
func GetSources(c *gin.Context) {
    sources := sourceManager.List()
    Success(c, sources)
}

// SearchSource 搜索指定音源
func SearchSource(c *gin.Context) {
    sourceID := c.Param("id")
    keyword := c.Query("q")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    
    source, err := sourceManager.Get(sourceID)
    if err != nil {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    result, err := source.Search(keyword, page)
    if err != nil {
        Error(c, http.StatusInternalServerError, err.Error())
        return
    }
    
    Success(c, result)
}

// GetSourceCategories 获取音源分类
func GetSourceCategories(c *gin.Context) {
    sourceID := c.Param("id")
    
    source, err := sourceManager.Get(sourceID)
    if err != nil {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    categories, err := source.GetCategories()
    if err != nil {
        Error(c, http.StatusInternalServerError, err.Error())
        return
    }
    
    Success(c, categories)
}

// GetBookDetail 获取书籍详情
func GetBookDetail(c *gin.Context) {
    sourceID := c.Param("id")
    bookID := c.Param("bookId")
    
    source, err := sourceManager.Get(sourceID)
    if err != nil {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    detail, err := source.GetBookDetail(bookID)
    if err != nil {
        Error(c, http.StatusInternalServerError, err.Error())
        return
    }
    
    Success(c, detail)
}

// GetAudioURL 获取音频URL
func GetAudioURL(c *gin.Context) {
    sourceID := c.Param("id")
    episodeURL := c.Query("url")
    
    source, err := sourceManager.Get(sourceID)
    if err != nil {
        Error(c, http.StatusNotFound, "Source not found")
        return
    }
    
    audioURL, err := source.GetAudioURL(episodeURL)
    if err != nil {
        Error(c, http.StatusInternalServerError, err.Error())
        return
    }
    
    Success(c, gin.H{"audio_url": audioURL})
}

// GlobalSearch 全局搜索
func GlobalSearch(c *gin.Context) {
    keyword := c.Query("q")
    books := sourceManager.SearchAll(keyword)
    Success(c, books)
}
```

#### 3.3.4 路由注册

```go
// backend/tingshu/api/routes.go 中添加

// 音源相关路由
sourceGroup := v1Group.Group("/sources")
{
    sourceGroup.GET("", v1.GetSources)
    sourceGroup.GET("/search", v1.GlobalSearch)
    sourceGroup.GET("/:id/search", v1.SearchSource)
    sourceGroup.GET("/:id/categories", v1.GetSourceCategories)
    sourceGroup.GET("/:id/categories/:catId/books", v1.GetCategoryBooks)
    sourceGroup.GET("/:id/books/:bookId", v1.GetBookDetail)
    sourceGroup.GET("/:id/audio", v1.GetAudioURL)
}
```

---

## 四、移动端集成

### 4.1 API 服务扩展

```typescript
// mobile-app/src/services/api.ts 中添加

// 音源相关 API
export const sourceApi = {
  // 获取所有音源
  getSources: () => api.get<SourceInfo[]>('/sources'),
  
  // 全局搜索
  globalSearch: (keyword: string) => 
    api.get<Book[]>('/sources/search', { params: { q: keyword } }),
  
  // 搜索指定音源
  searchSource: (sourceId: string, keyword: string, page = 1) =>
    api.get<SearchResult>(`/sources/${sourceId}/search`, { 
      params: { q: keyword, page } 
    }),
  
  // 获取音源分类
  getCategories: (sourceId: string) =>
    api.get<Category[]>(`/sources/${sourceId}/categories`),
  
  // 获取分类下的书籍
  getCategoryBooks: (sourceId: string, categoryId: string, page = 1) =>
    api.get<SearchResult>(`/sources/${sourceId}/categories/${categoryId}/books`, {
      params: { page }
    }),
  
  // 获取书籍详情
  getBookDetail: (sourceId: string, bookId: string) =>
    api.get<BookDetail>(`/sources/${sourceId}/books/${bookId}`),
  
  // 获取音频URL
  getAudioUrl: (sourceId: string, episodeUrl: string) =>
    api.get<{ audio_url: string }>(`/sources/${sourceId}/audio`, {
      params: { url: episodeUrl }
    }),
};
```

### 4.2 类型定义

```typescript
// mobile-app/src/types/source.ts

export interface SourceInfo {
  id: string;
  name: string;
  description: string;
  searchable: boolean;
  has_categories: boolean;
}

export interface SearchResult {
  books: ExternalBook[];
  total_page: number;
  current_page: number;
}

export interface ExternalBook {
  id: string;
  title: string;
  author: string;
  artist: string;
  cover_url: string;
  description: string;
  status: string;
  source_id: string;
}

export interface ExternalBookDetail extends ExternalBook {
  episodes: ExternalEpisode[];
}

export interface ExternalEpisode {
  id: string;
  title: string;
  url: string;
  duration: number;
  is_free: boolean;
}

export interface Category {
  id: string;
  name: string;
}
```

---

## 五、实施步骤

### 第一阶段：基础架构 (1-2天)

1. 创建 `backend/tingshu/scraper/` 目录结构
2. 实现 `AudioSource` 接口和 `Manager`
3. 添加 API 路由
4. 数据库表创建

### 第二阶段：首批音源 (2-3天)

1. 实现 LibriVox 音源 (公版书，最安全)
2. 实现酷我畅听音源 (API 稳定)
3. 测试搜索和播放功能

### 第三阶段：移动端集成 (1-2天)

1. 添加音源选择界面
2. 集成搜索功能
3. 播放器对接外部音源

### 第四阶段：扩展音源 (持续)

1. 根据需求添加更多音源
2. 实现音源配置管理
3. 添加缓存机制

---

## 六、注意事项

### 6.1 法律合规

1. **优先使用公版内容**: LibriVox、Archive.org 等
2. **遵守 robots.txt**: 爬取前检查网站规则
3. **合理请求频率**: 避免对目标网站造成压力
4. **用户协议**: 明确告知用户内容来源

### 6.2 技术风险

1. **API 变更**: 第三方 API 可能随时变更，需要监控和维护
2. **反爬机制**: 部分网站有反爬措施，需要处理
3. **音频链接时效**: 部分音频 URL 有时效性，需要实时获取

### 6.3 性能优化

1. **缓存策略**: 书籍信息缓存，减少重复请求
2. **并发控制**: 限制并发请求数量
3. **错误重试**: 网络请求失败时的重试机制

---

## 七、参考资源

- [Ximalaya-Downloader](https://github.com/Diaoxiaozhang/Ximalaya-Downloader) - 喜马拉雅下载工具
- [eprendre/tingshu](https://github.com/eprendre/tingshu) - 我的听书 Android 应用
- [Colly](https://github.com/gocolly/colly) - Go 爬虫框架
- [LibriVox API](https://librivox.org/api/info) - 公版有声书 API
- [Internet Archive API](https://archive.org/developers/) - 互联网档案馆 API
