# Supabase 快速配置指南

## 📋 获取 Supabase 连接信息

### 1. 进入 Supabase Dashboard
访问: https://supabase.com/dashboard

### 2. 获取 API 配置
**路径**: Settings → API

复制以下信息：
- ✅ **Project URL**: `https://xxxxx.supabase.co`
- ✅ **anon public key**: `eyJhbGc...` (很长的字符串)
- ✅ **service_role key**: `eyJhbGc...` (另一个很长的字符串)

### 3. 获取数据库密码
**路径**: Settings → Database

复制：
- ✅ **Database Password**: 你创建项目时设置的密码

### 4. 获取 JWT Secret
**路径**: Settings → API

复制：
- ✅ **JWT Secret**: 用于验证 token

---

## ⚙️ 配置后端

### 1. 编辑 `backend/.env` 文件

```bash
cd backend
nano .env  # 或使用你喜欢的编辑器
```

### 2. 填入你的 Supabase 信息

```env
# 从 Settings → API 复制
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# 从 Settings → Database 复制
SUPABASE_DB_PASSWORD=your-database-password

# 从 Settings → API 复制
JWT_SECRET=your-jwt-secret

# 服务器配置（保持默认）
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
```

### 3. 安装依赖

```bash
cd backend
go get github.com/lib/pq
go get github.com/joho/godotenv
go mod tidy
```

### 4. 测试连接

```bash
go run cmd/main.go
```

如果看到 `Server starting on :8080`，说明连接成功！

---

## 📱 配置前端

### 1. 编辑 `mobile-app/.env` 文件

```bash
cd mobile-app
nano .env
```

### 2. 填入配置

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### 3. 安装依赖

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
npm install react-native-url-polyfill
```

### 4. 启动应用

```bash
npm start
```

---

## ✅ 验证连接

### 测试后端连接

在浏览器访问：
```
http://localhost:8080/api/v1/categories
```

应该返回分类列表的 JSON 数据。

### 测试前端连接

在移动应用中，打开首页应该能看到书籍列表。

---

## 🔍 常见问题

### Q: 找不到 Database Password？
A: 如果忘记了密码，可以在 Settings → Database → Reset database password 重置。

### Q: 连接超时？
A: 检查：
1. Supabase URL 是否正确
2. 数据库密码是否正确
3. 网络是否正常

### Q: 前端无法获取数据？
A: 检查：
1. 后端是否启动（`go run cmd/main.go`）
2. `.env` 文件中的 API_URL 是否正确
3. RLS 策略是否正确配置

---

## 📝 配置检查清单

- [ ] 已获取 Supabase Project URL
- [ ] 已获取 anon public key
- [ ] 已获取 service_role key
- [ ] 已获取数据库密码
- [ ] 已获取 JWT Secret
- [ ] 已配置 `backend/.env`
- [ ] 已配置 `mobile-app/.env`
- [ ] 后端依赖已安装
- [ ] 前端依赖已安装
- [ ] 后端启动成功
- [ ] 前端启动成功
- [ ] API 测试通过

---

## 🚀 下一步

配置完成后，你可以：

1. **开发 API 端点**: 在 `backend/tingshu/api/v1/` 添加新的 API
2. **测试功能**: 使用 Postman 或浏览器测试 API
3. **前端集成**: 在移动应用中调用 API

参考 `PLAN.md` 继续开发！
