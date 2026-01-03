package config

import (
	"database/sql"
	"fmt"
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

	return nil
}
