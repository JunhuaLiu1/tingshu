package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IconURL     string `json:"icon_url"`
}

func GetCategories(c *gin.Context) {
	rows, err := config.SupabaseDB.Query(`
		SELECT id, name, description, COALESCE(icon_url, '') as icon_url
		FROM categories
		ORDER BY id
	`)

	if err != nil {
		Error(c, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var cat Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.Description, &cat.IconURL); err != nil {
			continue
		}
		categories = append(categories, cat)
	}

	Success(c, categories)
}
