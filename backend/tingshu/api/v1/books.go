package v1

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

type Book struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Description string `json:"description"`
	CoverURL    string `json:"cover_url"`
	CategoryID  int    `json:"category_id"`
	Duration    int    `json:"duration"`
	PlayCount   int    `json:"play_count"`
}

func GetBooks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	rows, err := config.DB.Query(`
		SELECT id, title, author, description, cover_url, category_id, duration, play_count
		FROM books
		ORDER BY play_count DESC
		LIMIT ? OFFSET ?
	`, limit, offset)

	if err != nil {
		Error(c, http.StatusInternalServerError, "Failed to fetch books")
		return
	}
	defer rows.Close()

	var books []Book
	for rows.Next() {
		var book Book
		if err := rows.Scan(&book.ID, &book.Title, &book.Author, &book.Description,
			&book.CoverURL, &book.CategoryID, &book.Duration, &book.PlayCount); err != nil {
			continue
		}
		books = append(books, book)
	}

	var total int
	config.DB.QueryRow("SELECT COUNT(*) FROM books").Scan(&total)

	Success(c, gin.H{
		"data":      books,
		"total":     total,
		"page":      page,
		"page_size": limit,
	})
}

func GetBookByID(c *gin.Context) {
	id := c.Param("id")

	var book Book
	err := config.DB.QueryRow(`
		SELECT id, title, author, description, cover_url, category_id, duration, play_count
		FROM books WHERE id = ?
	`, id).Scan(&book.ID, &book.Title, &book.Author, &book.Description,
		&book.CoverURL, &book.CategoryID, &book.Duration, &book.PlayCount)

	if err != nil {
		Error(c, http.StatusNotFound, "Book not found")
		return
	}

	Success(c, book)
}

func GetBookEpisodes(c *gin.Context) {
	bookID := c.Param("id")

	rows, err := config.DB.Query(`
		SELECT id, book_id, title, audio_url, duration, episode_num, play_count
		FROM episodes
		WHERE book_id = ?
		ORDER BY episode_num ASC
	`, bookID)

	if err != nil {
		Error(c, http.StatusInternalServerError, "Failed to fetch episodes")
		return
	}
	defer rows.Close()

	type Episode struct {
		ID         int    `json:"id"`
		BookID     int    `json:"book_id"`
		Title      string `json:"title"`
		AudioURL   string `json:"audio_url"`
		Duration   int    `json:"duration"`
		EpisodeNum int    `json:"episode_num"`
		PlayCount  int    `json:"play_count"`
	}

	var episodes []Episode
	for rows.Next() {
		var ep Episode
		if err := rows.Scan(&ep.ID, &ep.BookID, &ep.Title, &ep.AudioURL,
			&ep.Duration, &ep.EpisodeNum, &ep.PlayCount); err != nil {
			continue
		}
		episodes = append(episodes, ep)
	}

	Success(c, episodes)
}
