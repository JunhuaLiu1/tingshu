package v1

import "github.com/gin-gonic/gin"

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Response 返回统一格式的响应
func Response(c *gin.Context, code int, message string, data ...interface{}) {
	var responseData interface{}
	if len(data) > 0 {
		responseData = data[0]
	}

	c.JSON(code, Response{
		Code:    code,
		Message: message,
		Data:    responseData,
	})
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	Response(c, 200, "success", data)
}

// Error 错误响应
func Error(c *gin.Context, code int, message string) {
	Response(c, code, message)
}