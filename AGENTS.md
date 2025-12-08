# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 项目概况

这是一个全栈有声书应用"EtherAudio"(极简听书),包含:
- **后端**: Go + Gin 框架、PostgreSQL 数据库、Redis 缓存
- **移动应用**: React Native 0.73 + TypeScript

## 常用命令

### 后端开发 (Go)

**启动开发服务器:**
```bash
cd backend
go run cmd/main.go
```

**构建可执行文件:**
```bash
cd backend
go build -o bin/tingshu cmd/main.go
./bin/tingshu
```

**运行测试:**
```bash
cd backend
go test ./...                    # 运行所有测试
go test -v ./tingshu/api/v1/     # 运行特定包的测试（verbose 模式）
go test -run TestFunctionName    # 运行单个测试
```

**数据库初始化:**
```bash
cd backend
cp .env.example .env             # 复制环境变量模板
# 编辑 .env 配置 Supabase 连接信息:
#   SUPABASE_URL=https://xxx.supabase.co
#   SUPABASE_DB_PASSWORD=your_password
go run cmd/main.go               # 启动时自动连接 Supabase
```

**依赖管理:**
```bash
cd backend
go mod download                  # 下载依赖
go mod tidy                      # 清理未使用的依赖
```

### 移动应用开发 (React Native + Expo)

**安装依赖:**
```bash
cd mobile-app
npm install
cd ios && pod install && cd ..   # iOS 需要额外安装 pods
```

**启动开发 (Expo 离线模式):**
```bash
cd mobile-app
npm start                        # 启动 Metro bundler (EXPO_OFFLINE=1 已配置)
npm run android                  # 在新终端运行 Android 应用
npm run ios                      # 在新终端运行 iOS 应用
npm run web                      # 运行 Web 版本
```

**代码检查:**
```bash
cd mobile-app
npm run lint                     # 检查代码规范 (使用 expo lint)
```

**重置项目:**
```bash
cd mobile-app
npm run reset-project            # 重置项目配置
```

## 核心架构

### 后端架构 (Go)

**请求处理流程:**
1. HTTP 请求 → Gin 路由 (`backend/tingshu/api/routes.go`)
2. 中间件链 → CORS、Logger、Recovery、Auth (`backend/tingshu/middleware/`)
3. API 处理器 → 版本化 API 端点 (`backend/tingshu/api/v1/`)
4. 数据层 → 原生 SQL 查询 (通过 `config.SupabaseDB` 全局变量访问)
5. 数据库 → Supabase PostgreSQL (使用 `database/sql` + `lib/pq`)

**关键设计模式:**
- 所有 API 响应使用统一格式: `{code: number, message: string, data: T}`
- 使用 `v1.Success()`, `v1.Error()` 辅助函数构建响应 (`backend/tingshu/api/v1/response.go`)
- **数据库访问**: 使用原生 SQL (不使用 GORM ORM)
  - 所有查询通过 `config.SupabaseDB` (`*sql.DB`) 执行
  - 使用 `database/sql` 标准库 + `lib/pq` PostgreSQL 驱动
  - GORM 模型定义存在于 `backend/tingshu/model/models.go` 但**未实际使用**
- **无服务层**: 业务逻辑直接在 API 处理器中 (v1包),无独立 service 层
- **类型定义重复**: API 层在每个 handler 文件中自定义结构体 (如 `Book`, `Category`),与 GORM 模型分离

**环境变量配置:**
- `SERVER_HOST`, `SERVER_PORT` - 服务器配置
- **Supabase 配置** (必需):
  - `SUPABASE_URL` - Supabase 项目 URL (格式: `https://xxxxx.supabase.co`)
  - `SUPABASE_ANON_KEY` - 匿名访问密钥
  - `SUPABASE_SERVICE_KEY` - 服务端密钥
  - `SUPABASE_DB_PASSWORD` - PostgreSQL 数据库密码
- `REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB` - Redis 配置 (已定义但未使用)
- `JWT_SECRET` - JWT 认证密钥 (中间件存根未实现)

**数据模型关系:**
- `User` (用户) ← `PlayHistory` (播放历史)
- `Book` (书籍) → `Episode` (章节)
- `Book` ← `Category` (分类)
- `Book` ← `Ranking` (排行榜)
- `PlayHistory` 关联 `User`, `Book`, `Episode`

### 移动应用架构 (React Native)

**技术栈:**
- **框架**: Expo ~54.0.27 + React Native 0.81.5
- **导航**: @react-navigation/native 7.x + @react-navigation/bottom-tabs
- **HTTP 客户端**: axios 1.x
- **存储**: @react-native-async-storage/async-storage
- **音频**: react-native-audio-recorder-player, react-native-sound, react-native-video
- **重要**: 所有脚本使用 `EXPO_OFFLINE=1` 环境变量 (离线模式)

**导航结构:**
- 底部标签导航 (`@react-navigation/bottom-tabs`)
- 标签顺序: 首页 → 搜索 → 播放器 → 历史 → 个人中心

**组件层级:**
```
App.tsx (根导航)
├── screens/ (页面组件)
│   ├── HomeScreen.tsx (包含多个组合组件)
│   ├── SearchScreen.tsx
│   ├── PlayerScreen.tsx
│   ├── HistoryScreen.tsx
│   └── ProfileScreen.tsx
└── components/ (可复用组件)
    ├── HeroCarousel.tsx (轮播图)
    ├── CategoryTabs.tsx (分类标签)
    ├── EditorsPick.tsx (编辑推荐)
    └── Rankings.tsx (排行榜)
```

**数据流:**
1. API 调用 → `services/api.ts` (axios 拦截器处理认证)
2. 类型定义 → `types/index.ts` (所有 TypeScript 类型)
3. 模拟数据 → `data/mockData.ts` (后端不可用时的降级方案)

**类型系统注意事项:**
- Book 类型支持双格式: 后端 snake_case (`cover_url`) 和前端 camelCase (`coverUrl`)
- 所有新组件必须包含完整的 TypeScript 类型定义
- API 响应类型应与后端保持一致

**API 集成:**
- 基础 URL: `http://localhost:8080/api/v1` (在 `services/api.ts` 配置)
- 后端不可用时自动使用模拟数据 (`data/mockData.ts`)
- API 客户端使用 axios 实例，配置了请求/响应拦截器
- 认证令牌通过 localStorage 存储并在请求头中自动附加 (`Authorization: Bearer <token>`)
- API 模块化导出: `bookApi`, `categoryApi`, `rankingApi`, `searchApi`, `userApi`, `healthApi`
- 所有 API 方法返回类型化的 `Promise<ApiResponse<T>>`

**重要约定:**
- localStorage 在 React Native 中实际使用 AsyncStorage (需要导入处理)
- 401 响应会自动清除认证令牌

## 开发模式最佳实践

### 添加后端 API 端点

**重要前提**: 当前项目使用原生 SQL,**不使用** GORM ORM。

1. **定义数据结构**
   - 在对应的 API handler 文件 (如 `backend/tingshu/api/v1/books.go`) 中定义响应结构体
   - 使用 JSON 标签定义字段序列化格式 (snake_case): `json:"cover_url"`
   - 示例:
     ```go
     type Book struct {
         ID       int    `json:"id"`
         Title    string `json:"title"`
         CoverURL string `json:"cover_url"`
     }
     ```

2. **实现 API 处理器** (`backend/tingshu/api/v1/`)
   - 使用 `config.SupabaseDB.Query()` 或 `config.SupabaseDB.QueryRow()` 执行原生 SQL
   - 使用 `rows.Scan()` 映射查询结果到结构体
   - 使用 `v1.Success(c, data)` 返回成功响应
   - 使用 `v1.Error(c, code, message)` 返回错误响应
   - 示例:
     ```go
     func GetBooks(c *gin.Context) {
         rows, err := config.SupabaseDB.Query(`
             SELECT id, title, cover_url FROM books
             LIMIT 20
         `)
         if err != nil {
             Error(c, http.StatusInternalServerError, "Failed to fetch books")
             return
         }
         defer rows.Close()
         
         var books []Book
         for rows.Next() {
             var book Book
             rows.Scan(&book.ID, &book.Title, &book.CoverURL)
             books = append(books, book)
         }
         Success(c, books)
     }
     ```

3. **注册路由** (`backend/tingshu/api/routes.go`)
   - 公开路由直接注册到 `v1Group`
   - 需要认证的路由注册到 `authGroup` (使用 `middleware.Auth()`,但当前为存根)
   - 示例: `v1Group.GET("/books", v1.GetBooks)`

4. **数据库访问规范**
   - 使用 `config.SupabaseDB` 全局变量访问数据库
   - 所有 SQL 使用参数化查询防止注入: `Query("SELECT * FROM books WHERE id = $1", id)`
   - PostgreSQL 占位符使用 `$1`, `$2`, `$3` 格式
   - 必须调用 `defer rows.Close()` 释放资源

5. **响应格式规范**
   - 成功响应: `{code: 200, message: "success", data: {...}}`
   - 错误响应: `{code: 4xx/5xx, message: "error message"}`

**后端 API 路由映射:**
- `GET /api/v1/books` - 获取书籍列表 (支持分页: `?page=1&limit=20`)
- `GET /api/v1/books/:id` - 获取书籍详情
- `GET /api/v1/books/:id/episodes` - 获取书籍章节列表
- `GET /api/v1/categories` - 获取所有分类
- `GET /api/v1/rankings?period=daily` - 获取排行榜 (period: daily/weekly/monthly)
- `GET /api/v1/search?q=keyword` - 搜索书籍 (ILIKE 模糊匹配 title/author/description)
- `GET /health` - 健康检查端点

### 添加移动端界面

1. 在 `mobile-app/src/types/index.ts` 定义 TypeScript 类型
   - 确保类型与后端 API 响应一致
   - Book 类型支持 snake_case 和 camelCase 双格式
2. 在 `mobile-app/src/components/` 创建可复用组件
   - 使用函数组件 + TypeScript
   - 导出带类型的 Props 接口
3. 在 `mobile-app/src/screens/` 创建或更新页面组件
   - 使用 React Navigation 类型: `NativeStackScreenProps<ParamList, 'ScreenName'>`
4. 通过 `services/api.ts` 调用后端 API
   - 导入对应的 API 模块: `bookApi`, `categoryApi` 等
   - 处理 Promise 和错误情况
5. 在 `data/mockData.ts` 添加对应的模拟数据 (用于后端不可用时的降级)
6. **重要**: React Native 使用相对导入 `../` 而不是别名路径

**移动端组件分类:**
- **screens/**: 完整页面组件 (HomeScreen, SearchScreen, PlayerScreen, HistoryScreen, ProfileScreen)
- **components/**: 可复用 UI 组件 (HeroCarousel, CategoryTabs, EditorsPick, Rankings)

### 数据格式处理

- 后端返回 snake_case (`cover_url`, `play_count`)
- 前端使用 camelCase (`coverUrl`, `playCount`)
- 类型定义需要支持两种格式以兼容现有代码
- API 响应格式: `{code: number, message: string, data: T}`

## 已知限制和技术债务

### 后端
- **数据库架构矛盾** ⚠️ **最严重问题**:
  - GORM 模型已定义 (`backend/tingshu/model/models.go`) 但完全未使用
  - 所有 API 使用原生 SQL (`database/sql` + `lib/pq`)
  - API 层自定义结构体与 GORM 模型重复定义 (如 `v1.Book` vs `model.Book`)
  - 后果: 维护两套数据模型,类型不一致,无法使用 GORM 特性 (关联查询、迁移、软删除)
- **JWT 认证未实现**: `middleware.Auth()` 当前为存根,仅检查 token 存在性,不验证有效性 (见 `backend/tingshu/middleware/middleware.go:47-58`)
- **无服务层**: 业务逻辑直接写在 API 处理器中,无独立 service 层,违反单一职责原则
- **无测试覆盖**: 缺少单元测试和集成测试
- **数据库 Schema 管理混乱**: 
  - 无数据库迁移脚本 (不使用 GORM AutoMigrate)
  - 无种子数据脚本
  - Schema 变更依赖手动 SQL 或 Supabase Dashboard
- **Redis 已配置但未使用**: 环境变量已加载但无缓存逻辑实现
- **分页未标准化**: `GetBooks` 返回 `{data, total, page, page_size}`,其他接口无分页
- **错误处理简陋**: SQL 错误直接返回 500,无详细日志,`rows.Scan` 错误被 `continue` 静默跳过
- **SQL 注入风险**: 虽然使用参数化查询,但 `SearchBooks` 中的 `ILIKE` 模式需要额外验证

### 移动应用
- **播放器未完成**: PlayerScreen 界面已实现但音频播放逻辑未完全集成
- **认证流程缺失**: 用户登录/注册界面和逻辑未实现
- **localStorage 问题**: `services/api.ts` 使用 `localStorage` 但 React Native 需要 `AsyncStorage` (需要同步改为异步)
- **无错误边界**: 缺少 Error Boundary 组件处理运行时错误
- **无状态管理**: 使用本地 state,未集成 Context API/Redux/Zustand
- **错误处理基础**: API 错误仅通过 alert 显示,需要更好的 UI 反馈
- **Expo 离线模式**: 所有脚本强制使用 `EXPO_OFFLINE=1`,可能影响某些功能
- **测试脚本缺失**: package.json 中有 `npm test` 但未配置测试框架

## 开发工作流

**独立启动后端:**
1. 配置 Supabase 项目
   - 在 [Supabase Dashboard](https://app.supabase.com) 创建项目
   - 从 Settings > API 获取 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
   - 从 Settings > Database 获取数据库密码 (`SUPABASE_DB_PASSWORD`)
2. 配置 Redis (可选,当前未使用)
3. 配置 `.env` 文件
4. `cd backend && go run cmd/main.go`
5. 后端运行在 http://localhost:8080
6. 访问 http://localhost:8080/health 验证服务状态

**独立启动移动应用:**
1. 确保后端运行以获得完整功能
2. 后端不可用时会使用模拟数据
3. `cd mobile-app && npm start`
4. 在新终端运行 `npm run android` 或 `npm run ios`

## 添加新功能时的注意事项

1. **后端数据库访问规范** ⚠️ **关键**:
   - 当前项目**不使用 GORM ORM**,使用原生 SQL
   - 通过 `config.SupabaseDB` (`*sql.DB`) 执行查询
   - 在 API handler 文件中定义结构体,不依赖 `model/models.go` 中的 GORM 模型
   - 使用 PostgreSQL 占位符语法 `$1`, `$2` 而非 `?`
   - 必须使用参数化查询防止 SQL 注入
2. **Supabase 连接字符串格式**:
   - 格式: `postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres?sslmode=require`
   - 项目引用从 `SUPABASE_URL` 自动提取 (见 `config/supabase.go:extractProjectRef()`)
3. **前端数据格式兼容**: Book 类型支持 `cover_url` 和 `coverUrl` 双格式,维护模拟数据兼容性以支持离线开发
4. **后端中间件**: 使用已建立的中间件链 (CORS、Logger、Recovery),新路由注册到正确的路由组 (公开 vs 认证)
5. **移动端数据处理**: 处理后端 snake_case 和前端 camelCase 两种格式,必要时在 API 层转换
6. **API 响应规范**: 严格遵循 `{code, message, data}` 响应格式,使用 `v1.Success()` 和 `v1.Error()` 辅助函数
7. **TypeScript 类型完整性**: 所有新组件、API 函数必须包含完整类型定义,避免 `any` 类型
8. **Go 包导入路径**: 使用 `github.com/username/tingshu-backend/tingshu/...` 导入本地包
9. **环境变量管理**: 同时更新 `backend/.env.example` 和实际 `.env` 文件
10. **移动端导入**: 使用相对路径 `../` 而不是别名 `@/` 或 `~/`
11. **Expo 限制**: 注意 Expo 在离线模式下的限制,某些原生模块可能需要特殊配置
12. **数据库 Schema 变更**: 当前无自动迁移,需要在 Supabase Dashboard 手动执行 SQL 或编写迁移脚本