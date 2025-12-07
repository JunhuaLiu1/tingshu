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
go test -v ./tingshu/api/v1/     # 运行特定包的测试
```

**数据库初始化:**
```bash
cd backend
cp .env.example .env             # 复制环境变量模板
# 编辑 .env 配置数据库连接信息
go run cmd/main.go               # 启动时自动执行 GORM 迁移
```

### 移动应用开发 (React Native)

**安装依赖:**
```bash
cd mobile-app
npm install
cd ios && pod install && cd ..   # iOS 需要额外安装 pods
```

**启动开发:**
```bash
cd mobile-app
npm start                        # 启动 Metro bundler
npm run android                  # 在新终端运行 Android 应用
npm run ios                      # 在新终端运行 iOS 应用
```

**代码检查与修复:**
```bash
cd mobile-app
npm run lint                     # 检查代码规范
npm run lint -- --fix            # 自动修复代码问题
```

**测试:**
```bash
cd mobile-app
npm test
```

**构建生产版本:**
```bash
cd mobile-app
npm run build:android            # 构建 Android 发布版本
npm run build:ios                # 构建 iOS 发布版本
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
- 使用 `Response()` 辅助函数构建响应
- 数据库模型使用 GORM 自动迁移 (启动时执行)
- 服务层 (`backend/tingshu/service/`) 目前为空,业务逻辑在 API 处理器中

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
- 基础 URL: `http://localhost:8080/api/v1` (在 `api.ts` 配置)
- 后端不可用时自动使用模拟数据
- 认证令牌存储在 localStorage (认证中间件当前已禁用)

## 开发模式最佳实践

### 添加后端 API 端点

1. 在 `backend/tingshu/model/models.go` 定义或更新 GORM 模型
2. 在 `backend/tingshu/api/v1/` 创建或编辑对应包的处理器
3. 在 `backend/tingshu/api/routes.go` 注册路由
4. 使用 `config.DB` 访问数据库
5. 使用 `Response()` 返回统一格式响应

### 添加移动端界面

1. 在 `mobile-app/src/types/index.ts` 定义 TypeScript 类型
2. 在 `mobile-app/src/components/` 创建可复用组件
3. 在 `mobile-app/src/screens/` 创建或更新页面组件
4. 通过 `services/api.ts` 调用后端 API
5. 在 `data/mockData.ts` 添加对应的模拟数据 (用于离线开发)
6. 使用相对路径导入 `src/` 目录下的模块

### 数据格式处理

- 后端返回 snake_case (`cover_url`, `play_count`)
- 前端使用 camelCase (`coverUrl`, `playCount`)
- 类型定义需要支持两种格式以兼容现有代码
- API 响应格式: `{code: number, message: string, data: T}`

## 已知限制和技术债务

### 后端
- JWT 认证中间件已存根但未实现 (总是返回 `c.Next()`)
- 服务层为空 - 业务逻辑当前在 API 处理器中
- 无测试覆盖
- 仅使用 GORM 自动迁移,无数据库种子数据或迁移脚本
- Redis 已初始化但未在任何缓存逻辑中使用

### 移动应用
- 播放器界面已完成但音频播放未完全集成
- 认证流程未实现
- 无错误边界
- 无状态管理库 (Context API、Redux 等) - 当前使用本地状态
- API 错误处理基础 (仅显示 alerts)

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

1. **前端**: 维护模拟数据兼容性以支持离线开发
2. **后端**: 使用已建立的中间件模式 (CORS、Logger、Recovery)
3. **移动端**: 处理后端和前端两种数据格式 (camelCase vs snake_case)
4. **API**: 遵循现有响应格式规范
5. **TypeScript**: 所有新组件包含完整类型定义
6. **Go**: 遵循现有控制器模式,服务使用依赖注入
7. **环境变量**: 同时更新 `backend/.env.example` 和实际 `.env` 文件
