package middleware

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/username/tingshu-backend/tingshu/config"
)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s %s %d %s\n",
			param.TimeStamp.Format("2006/01/02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
		)
	})
}

func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		c.JSON(500, gin.H{
			"code":    500,
			"message": "Internal server error",
		})
		c.Abort()
	})
}

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(401, gin.H{"code": 401, "message": "Unauthorized"})
			c.Abort()
			return
		}

		// 解析 Bearer token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(401, gin.H{"code": 401, "message": "Invalid token format"})
			c.Abort()
			return
		}

		// 验证 JWT token
		secret := strings.TrimSpace(config.AppConfig.JWTSecret)
		if secret == "" {
			c.JSON(500, gin.H{"code": 500, "message": "JWT secret not configured"})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(401, gin.H{"code": 401, "message": "Invalid or expired token"})
			c.Abort()
			return
		}

		// 从 claims 中提取用户信息并设置到 context
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if sub, ok := claims["sub"].(string); ok {
				c.Set("profile_id", sub)
			}
			if userID, ok := claims["user_id"].(string); ok {
				c.Set("user_id", userID)
			}
			if email, ok := claims["email"].(string); ok {
				c.Set("email", email)
			}
		}

		c.Next()
	}
}
