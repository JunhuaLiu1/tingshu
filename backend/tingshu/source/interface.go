package source

import "time"

type Source interface {
	ID() string
	Name() string
	Description() string
	BaseURL() string
	Version() string
	IsSearchable() bool
	HasCategories() bool
	NeedProxy() bool
	NeedCookie() bool
	Search(keyword string, page int) (*SearchResult, error)
	GetBookDetail(bookID string) (*BookDetail, error)
	GetAudioURL(episodeID string) (string, error)
	GetCategories() ([]Category, error)
	GetChapters(bookID string) ([]Chapter, error)
	HealthCheck() HealthStatus
}

type SourceInfo struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	BaseURL       string  `json:"base_url"`
	Version       string  `json:"version"`
	Searchable    bool    `json:"searchable"`
	HasCategories bool    `json:"has_categories"`
	Enabled       bool    `json:"enabled"`
	HealthStatus  string  `json:"health_status"`
	SuccessRate   float64 `json:"success_rate"`
}

type SearchResult struct {
	Books       []Book `json:"books"`
	TotalPage   int    `json:"total_page"`
	CurrentPage int    `json:"current_page"`
}

type Book struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Author       string `json:"author"`
	Artist       string `json:"artist"`
	CoverURL     string `json:"cover_url"`
	Description  string `json:"description"`
	Status       string `json:"status"`
	SourceID     string `json:"source_id"`
	ChapterCount int    `json:"chapter_count"`
	PlayCount    int    `json:"play_count"`
}

type BookDetail struct {
	Book
	Chapters   []Chapter `json:"chapters"`
	Categories []string  `json:"categories"`
	Tags       []string  `json:"tags"`
}

type Episode struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	IsFree   bool   `json:"is_free"`
	AudioURL string `json:"audio_url,omitempty"`
}

type Category struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Count   int    `json:"count"`
	IconURL string `json:"icon_url"`
}

type Chapter struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Index     int    `json:"index"`
	Duration  int    `json:"duration"`
	IsFree    bool   `json:"is_free"`
	IsVip     bool   `json:"is_vip"`
	UpdatedAt string `json:"updated_at"`
}

type HealthStatus struct {
	Status      string    `json:"status"`
	SuccessRate float64   `json:"success_rate"`
	LastCheckAt time.Time `json:"last_check_at"`
	Error       string    `json:"error,omitempty"`
}
