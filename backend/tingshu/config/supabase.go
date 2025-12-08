package config

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

var SupabaseDB *sql.DB

func InitSupabase() error {
	// 从 Supabase URL 构建 PostgreSQL 连接字符串
	// Supabase URL 格式: https://xxxxx.supabase.co
	// PostgreSQL 连接格式: postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres
	
	// 注意：需要从 Supabase Dashboard > Settings > Database 获取数据库密码
	dbPassword := getEnv("SUPABASE_DB_PASSWORD", "")
	
	// 从 URL 提取项目 ID
	projectRef := extractProjectRef(AppConfig.SupabaseURL)
	
	connStr := fmt.Sprintf(
		"postgresql://postgres:%s@db.%s.supabase.co:5432/postgres?sslmode=require",
		dbPassword,
		projectRef,
	)

	var err error
	SupabaseDB, err = sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to Supabase: %w", err)
	}

	// 测试连接
	if err = SupabaseDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping Supabase: %w", err)
	}

	// 设置连接池
	SupabaseDB.SetMaxOpenConns(25)
	SupabaseDB.SetMaxIdleConns(5)

	return nil
}

func extractProjectRef(url string) string {
	// 从 https://xxxxx.supabase.co 提取 xxxxx
	if len(url) > 8 {
		url = url[8:] // 移除 https://
	}
	for i, c := range url {
		if c == '.' {
			return url[:i]
		}
	}
	return url
}
