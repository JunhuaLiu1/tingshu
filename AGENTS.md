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
# 编辑 .env 配置数据库连接信息
go run cmd/main.go               # 启动时自动执行 GORM 迁移
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
4. 数据层 → GORM 模型 (`backend/tingshu/model/models.go`)
5. 数据库 → PostgreSQL (通过 `config.DB` 全局变量访问)

**关键设计模式:**
- 所有 API 响应使用统一格式: `{code: number, message: string, data: T}`
- 使用 `v1.Response()`, `v1.Success()`, `v1.Error()` 辅助函数构建响应 (`backend/tingshu/api/response.go`)
- 数据库模型使用 GORM 自动迁移 (启动时执行)
- 服务层 (`backend/tingshu/service/`) 目前为空,业务逻辑在 API 处理器中
- 所有 GORM 模型使用软删除 (`DeletedAt` 字段)

**环境变量配置:**
- `SERVER_HOST`, `SERVER_PORT` - 服务器配置
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_MODE` - PostgreSQL 配置
- `REDIS_ADDR`, `REDIS_PASSWORD`, `REDIS_DB` - Redis 配置
- `JWT_SECRET` - JWT 认证密钥
- `GEMINI_API_KEY` - AI 功能预留

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

1. 在 `backend/tingshu/model/models.go` 定义或更新 GORM 模型
   - 所有模型必须包含 `CreatedAt`, `UpdatedAt`, `DeletedAt` (软删除)
   - 使用 GORM 标签定义字段约束: `gorm:"not null"`, `gorm:"uniqueIndex"` 等
   - JSON 序列化使用 snake_case: `json:"cover_url"`
2. 在 `backend/tingshu/api/v1/` 创建或编辑对应的处理器文件 (如 `books.go`)
   - 使用 `v1.Success(c, data)` 返回成功响应
   - 使用 `v1.Error(c, code, message)` 返回错误响应
3. 在 `backend/tingshu/api/routes.go` 注册路由
   - 公开路由直接注册到 `v1Group`
   - 需要认证的路由注册到 `authGroup` (使用 `middleware.Auth()`)
4. 使用 `config.DB` 访问数据库
5. 响应格式自动遵循 `{code: number, message: string, data: T}`

**后端 API 路由映射:**
- `GET /api/v1/books` - 获取书籍列表 (支持分页)
- `GET /api/v1/books/:id` - 获取书籍详情
- `GET /api/v1/books/:id/episodes` - 获取书籍章节
- `GET /api/v1/categories` - 获取所有分类
- `GET /api/v1/rankings` - 获取默认排行榜
- `GET /api/v1/rankings/:period` - 获取指定周期排行榜 (daily/weekly/monthly)
- `GET /api/v1/search?q=keyword` - 搜索书籍
- 认证路由组 (`/api/v1/users/*`) 需要 JWT token

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
- **JWT 认证未实现**: `middleware.Auth()` 当前为存根,总是调用 `c.Next()` (见 `backend/tingshu/middleware/middleware.go:62-73`)
- **中间件安全问题**: Logger 和 Recovery 中间件错误地使用了 `config.AppConfig.JWTSecret` (需要修复)
- **服务层为空**: 业务逻辑当前直接在 API 处理器中,未使用依赖注入
- **无测试覆盖**: 缺少单元测试和集成测试
- **数据库迁移**: 仅使用 GORM 自动迁移,无种子数据脚本或版本化迁移
- **Redis 未使用**: 已初始化 Redis 连接但未在任何缓存逻辑中使用
- **分页未标准化**: API 响应中缺少统一的分页结构

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
1. 配置 PostgreSQL 数据库
2. 配置 Redis (可选)
3. `cd backend && go run cmd/main.go`
4. 后端运行在 http://localhost:8080

**独立启动移动应用:**
1. 确保后端运行以获得完整功能
2. 后端不可用时会使用模拟数据
3. `cd mobile-app && npm start`
4. 在新终端运行 `npm run android` 或 `npm run ios`

## 添加新功能时的注意事项

1. **前端数据格式兼容**: Book 类型支持 `cover_url` 和 `coverUrl` 双格式,维护模拟数据兼容性以支持离线开发
2. **后端中间件**: 使用已建立的中间件链 (CORS、Logger、Recovery),新路由注册到正确的路由组 (公开 vs 认证)
3. **移动端数据处理**: 处理后端 snake_case 和前端 camelCase 两种格式,必要时在 API 层转换
4. **API 响应规范**: 严格遵循 `{code, message, data}` 响应格式,使用 `v1.Success()` 和 `v1.Error()` 辅助函数
5. **TypeScript 类型完整性**: 所有新组件、API 函数必须包含完整类型定义,避免 `any` 类型
6. **Go 包导入路径**: 使用 `github.com/username/tingshu-backend/tingshu/...` 导入本地包
7. **环境变量管理**: 同时更新 `backend/.env.example` 和实际 `.env` 文件
8. **GORM 模型约定**: 必须包含 `ID`, `CreatedAt`, `UpdatedAt`, `DeletedAt` 字段
9. **移动端导入**: 使用相对路径 `../` 而不是别名 `@/` 或 `~/`
10. **Expo 限制**: 注意 Expo 在离线模式下的限制,某些原生模块可能需要特殊配置