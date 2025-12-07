package model

import (
	"time"

	"gorm.io/gorm"
)

// 用户模型
type User struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	Username    string         `json:"username" gorm:"uniqueIndex;not null"`
	Email       string         `json:"email" gorm:"uniqueIndex;not null"`
	Avatar      string         `json:"avatar"`
	Phone       string         `json:"phone"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// 书籍模型
type Book struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	Title       string         `json:"title" gorm:"not null"`
	Author      string         `json:"author" gorm:"not null"`
	Description string         `json:"description"`
	CoverURL    string         `json:"cover_url" gorm:"not null"`
	AudioURL    string         `json:"audio_url"`
	Duration    int            `json:"duration"` // 总时长（秒）
	PlayCount   int64          `json:"play_count" gorm:"default:0"`
	CategoryID  *uint          `json:"category_id"`
	Category    Category       `json:"category" gorm:"foreignKey:CategoryID"`
	Episodes    []Episode      `json:"episodes,omitempty" gorm:"foreignKey:BookID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// 分类模型
type Category struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description"`
	Books       []Book         `json:"books,omitempty" gorm:"foreignKey:CategoryID"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// 剧集模型
type Episode struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	BookID      uint           `json:"book_id" gorm:"not null"`
	Book        Book           `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Title       string         `json:"title" gorm:"not null"`
	AudioURL    string         `json:"audio_url" gorm:"not null"`
	Duration    int            `json:"duration"` // 时长（秒）
	EpisodeNum  int            `json:"episode_num" gorm:"not null"`
	PlayCount   int64          `json:"play_count" gorm:"default:0"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

// 播放历史模型
type PlayHistory struct {
	ID           uint           `json:"id" gorm:"primarykey"`
	UserID       uint           `json:"user_id" gorm:"not null"`
	BookID       uint           `json:"book_id" gorm:"not null"`
	EpisodeID    *uint          `json:"episode_id"`
	Progress     int            `json:"progress"` // 播放进度（秒）
	Duration     int            `json:"duration"` // 总时长（秒）
	IsCompleted  bool           `json:"is_completed" gorm:"default:false"`
	LastPosition int            `json:"last_position"` // 最后播放位置（秒）
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

// 排行榜模型
type Ranking struct {
	ID        uint      `json:"id" gorm:"primarykey"`
	BookID    uint      `json:"book_id" gorm:"not null"`
	Book      Book      `json:"book,omitempty" gorm:"foreignKey:BookID"`
	Rank      int       `json:"rank" gorm:"not null"`
	Score     int64     `json:"score"` // 排名分数
	Period    string    `json:"period"` // 排名周期：daily, weekly, monthly
	Date      time.Time `json:"date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}