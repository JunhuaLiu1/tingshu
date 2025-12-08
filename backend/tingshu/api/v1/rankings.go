package v1

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/username/tingshu-backend/tingshu/config"
)

func GetRankings(c *gin.Context) {
	period := c.DefaultQuery("period", "daily")

	rows, err := config.SupabaseDB.Query(`
		SELECT r.rank, r.score, b.id, b.title, b.author, b.cover_url, b.play_count
		FROM rankings r
		JOIN books b ON r.book_id = b.id
		WHERE r.period = $1
		ORDER BY r.rank ASC
		LIMIT 50
	`, period)

	if err != nil {
		Error(c, http.StatusInternalServerError, "Failed to fetch rankings")
		return
	}
	defer rows.Close()

	type RankingItem struct {
		Rank      int    `json:"rank"`
		Score     int    `json:"score"`
		ID        int    `json:"id"`
		Title     string `json:"title"`
		Author    string `json:"author"`
		CoverURL  string `json:"cover_url"`
		PlayCount int    `json:"play_count"`
	}

	var rankings []RankingItem
	for rows.Next() {
		var item RankingItem
		if err := rows.Scan(&item.Rank, &item.Score, &item.ID, &item.Title,
			&item.Author, &item.CoverURL, &item.PlayCount); err != nil {
			continue
		}
		rankings = append(rankings, item)
	}

	Success(c, rankings)
}
