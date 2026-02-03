package config

import (
	"log"
)

func InitDB() error {
	// 使用 MySQL 连接
	if err := InitMySQL(); err != nil {
		return err
	}

	log.Println("MySQL connected successfully")
	return nil
}
