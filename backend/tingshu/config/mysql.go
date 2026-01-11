package config

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// DB 全局数据库连接
var DB *sql.DB

// InitMySQL 初始化MySQL连接
func InitMySQL() error {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		AppConfig.MySQLUser,
		AppConfig.MySQLPassword,
		AppConfig.MySQLHost,
		AppConfig.MySQLPort,
		AppConfig.MySQLDatabase,
	)

	log.Printf("MySQL connecting")

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("failed to connect to MySQL: %w", err)
	}

	// 测试连接
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping MySQL: %w", err)
	}

	// 设置连接池
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err := ensureProfilesSchema(DB); err != nil {
		return err
	}

	return nil
}

func ensureProfilesSchema(db *sql.DB) error {
	// 1) Create table if it doesn't exist (default schema for local MySQL).
	// Note: we keep it simple and compatible; auth API code can also work with an existing
	// UUID/string id schema, as long as required columns exist.
	createTableSQL := `
CREATE TABLE IF NOT EXISTS profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(7) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_profiles_user_id (user_id),
  UNIQUE KEY uk_profiles_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`
	if _, err := db.Exec(createTableSQL); err != nil {
		return fmt.Errorf("failed to ensure profiles table: %w", err)
	}

	// 2) Ensure password_hash exists for older schemas.
	var count int
	if err := db.QueryRow(
		"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'password_hash'",
	).Scan(&count); err != nil {
		return fmt.Errorf("failed to check profiles.password_hash column: %w", err)
	}
	if count == 0 {
		// Adding NOT NULL requires a default for existing rows.
		if _, err := db.Exec("ALTER TABLE profiles ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''"); err != nil {
			return fmt.Errorf("failed to add profiles.password_hash column: %w", err)
		}
	}

	return nil
}
