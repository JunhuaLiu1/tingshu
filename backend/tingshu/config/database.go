package config

import (
	"log"
)

func InitDB() error {
	// 使用 Supabase 连接
	if err := InitSupabase(); err != nil {
		return err
	}

	log.Println("Supabase connected successfully")
	return nil
}