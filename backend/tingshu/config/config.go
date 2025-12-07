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

	// 数据库配置
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis 配置
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// JWT 配置
	JWTSecret string

	// API 密钥
	GeminiAPIKey string

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
		ServerHost: getEnv("SERVER_HOST", "localhost"),
		ServerPort: getEnv("SERVER_PORT", "8080"),

		// 数据库配置
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "tingshu"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		// Redis 配置
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvAsInt("REDIS_DB", 0),

		// JWT 配置
		JWTSecret: getEnv("JWT_SECRET", "your-secret-key"),

		// API 密钥
		GeminiAPIKey: getEnv("GEMINI_API_KEY", ""),

		// CORS 配置
		CORSAllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:8081", // React Native Metro
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