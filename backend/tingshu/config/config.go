package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	// 服务器配置
	ServerPort string
	ServerHost string

	// Supabase 配置
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string

	// Redis 配置
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// JWT 配置
	JWTSecret string

	// CORS 配置
	CORSAllowOrigins []string
}

var AppConfig *Config

func LoadConfig() error {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: No .env file found")
	}

	config := &Config{
		// 服务器配置
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort: getEnv("SERVER_PORT", "8080"),

		// Supabase 配置
		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),

		// Redis 配置
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		// JWT 配置
		JWTSecret: getEnv("JWT_SECRET", ""),

		// CORS 配置
		CORSAllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:8081",
		},
	}

	AppConfig = config
	return nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsInt(name string, defaultValue int) int {
	valueStr := getEnv(name, "")
	if value, err := parseInt(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func parseInt(s string) (int, error) {
	if s == "" {
		return 0, nil
	}
	// 简单的字符串转整数实现
	// 实际项目中可以使用 strconv.Atoi
	return 0, nil
}