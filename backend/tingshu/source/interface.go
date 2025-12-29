package source

type Source interface {
	ID() string
	Name() string
	Description() string
	BaseURL() string
	Search(keyword string, page int) (*SearchResult, error)
	GetBookDetail(bookID string) (*BookDetail, error)
	GetAudioURL(episodeID string) (string, error)
}

type SourceInfo struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	BaseURL     string `json:"base_url"`
}

type SearchResult struct {
	Books       []Book `json:"books"`
	TotalPage   int    `json:"total_page"`
	CurrentPage int    `json:"current_page"`
}

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

type BookDetail struct {
	Book
	Episodes []Episode `json:"episodes"`
}

type Episode struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Duration int    `json:"duration"`
	IsFree   bool   `json:"is_free"`
}
