package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

func SearchBooks(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		Error(c, http.StatusBadRequest, "Search query is required")
		return
	}

	rows, err := config.SupabaseDB.Query(`
		SELECT id, title, author, description, cover_url, category_id, duration, play_count
		FROM books
		WHERE title ILIKE $1 OR author ILIKE $1 OR description ILIKE $1
		ORDER BY play_count DESC
		LIMIT 50
	`, "%"+query+"%")

	if err != nil {
		Error(c, http.StatusInternalServerError, "Search failed")
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

	Success(c, books)
}
