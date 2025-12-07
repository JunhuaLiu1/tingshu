# 📱 EtherAudio - 极简听书

这是一个专为移动设备设计的听书 React Native 应用，提供原生移动体验。

## 🏗️ 项目架构

```
tingshu/
├── mobile-app/                # React Native 应用
│   ├── src/                   # 源代码
│   │   ├── App.tsx           # 主应用组件
│   │   ├── screens/          # 页面组件
│   │   │   ├── HomeScreen.tsx      # 首页
│   │   │   ├── SearchScreen.tsx    # 搜索页
│   │   │   ├── PlayerScreen.tsx    # 播放器
│   │   │   ├── HistoryScreen.tsx   # 历史记录
│   │   │   └── ProfileScreen.tsx   # 个人中心
│   │   ├── components/       # UI 组件
│   │   │   ├── HeroCarousel.tsx    # 首页轮播
│   │   │   ├── CategoryTabs.tsx    # 分类标签
│   │   │   ├── EditorsPick.tsx     # 编辑推荐
│   │   │   └── Rankings.tsx        # 排行榜
│   │   ├── data/             # 数据层
│   │   │   └── mockData.ts        # 模拟数据
│   │   ├── services/         # 服务层
│   │   │   └── api.ts             # API 服务
│   │   └── types/            # 类型定义
│   │       └── index.ts          # TypeScript 类型
│   ├── android/              # Android 配置
│   ├── ios/                  # iOS 配置
│   ├── package.json          # 依赖管理
│   ├── tsconfig.json         # TypeScript 配置
│   └── .gitignore           # Git 忽略文件
├── backend/                   # 后端 API 服务 (Go)
│   ├── cmd/                  # 应用入口点
│   │   └── main.go          # 主程序入口
│   ├── tingshu/              # 应用源代码
│   │   ├── api/             # API 层
│   │   │   ├── routes.go     # 路由配置
│   │   │   └── v1/          # v1 版本 API
│   │   ├── config/          # 配置管理
│   │   │   └── database.go  # 数据库配置
│   │   ├── middleware/      # 中间件
│   │   ├── model/           # 数据模型
│   │   │   └── models.go    # GORM 模型定义
│   │   └── service/         # 业务逻辑层
│   ├── go.mod               # Go 模块依赖
│   ├── go.sum               # Go 依赖锁定文件
│   └── .env.example         # 环境变量模板
├── CLAUDE.md                 # Claude Code 指南
└── README.md                 # 项目说明
```

## 🚀 快速开始

### React Native 应用启动

1. **环境准备**
   - 确保已安装 Node.js (>= 14)
   - 安装 React Native CLI
   - 配置 Android Studio / Xcode

2. **进入项目目录**
   ```bash
   cd mobile-app
   ```

3. **安装依赖**
   ```bash
   npm install
   # iOS 还需要安装 pods
   cd ios && pod install && cd ..
   ```

4. **启动开发服务器**
   ```bash
   # 启动 Metro bundler
   npm start

   # 在新终端运行 Android
   npm run android

   # 或运行 iOS
   npm run ios
   ```

5. **构建生产版本**
   ```bash
   # Android
   npm run build:android

   # iOS
   npm run build:ios
   ```

### Go 后端服务启动

1. **环境准备**
   - 确保已安装 Go (>= 1.19)
   - 安装 PostgreSQL 数据库
   - 安装 Redis (可选)

2. **进入后端目录**
   ```bash
   cd backend
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件配置数据库连接等信息
   ```

4. **安装依赖**
   ```bash
   go mod download
   ```

5. **启动开发服务器**
   ```bash
   go run cmd/main.go
   ```

6. **构建生产版本**
   ```bash
   go build -o bin/tingshu cmd/main.go
   ./bin/tingshu
   ```

## 🛠️ 技术栈

### 移动端 (React Native)
- **框架**: React Native 0.73
- **语言**: TypeScript
- **导航**: React Navigation 6
- **图标**: React Native Vector Icons
- **动画**: React Native Animated API
- **网络**: Axios
- **存储**: AsyncStorage
- **音频**: React Native Audio Recorder Player
- **权限**: React Native Permissions
- **UI 组件**: React Native Elements

### 后端 (Go)
- **框架**: Gin Web Framework
- **数据库**: PostgreSQL + GORM
- **缓存**: Redis
- **认证**: JWT
- **API**: RESTful API
- **配置管理**: Viper

## 📱 功能特性

### 已实现功能
- ✅ 原生移动体验
- ✅ 精美的轮播组件（票据式设计）
- ✅ 分类标签展示
- ✅ 编辑推荐书籍
- ✅ 热门排行榜
- ✅ 响应式布局
- ✅ 平滑动画效果
- ✅ 阴影和视觉效果
- ✅ 导航结构
- ✅ Go 后端 API 服务
- ✅ PostgreSQL 数据库集成
- ✅ GORM 数据模型
- ✅ Redis 缓存支持
- ✅ JWT 认证中间件
- ✅ 统一 API 响应格式

### 计划功能
- 🔄 音频播放功能
- 🔄 搜索功能实现
- 🔄 用户数据管理
- 🔄 收藏功能
- 🔄 播放历史
- 🔄 离线缓存
- 🔄 推送通知

## 🗄️ 数据模型

### 核心实体
```typescript
interface Book {
  id: number | string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  audio_url?: string;
  duration?: number;
  play_count?: number;
  category_id?: number;
  rank?: number;
  episodes?: Episode[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Episode {
  id: number;
  book_id: number;
  title: string;
  audio_url: string;
  duration: number;
  episode_num: number;
  play_count: number;
}

interface PlayHistory {
  id: number;
  user_id: number;
  book_id: number;
  episode_id?: number;
  progress: number;
  duration: number;
  is_completed: boolean;
  last_position: number;
}
```

## 🌿 分支管理

### 分支结构
- `main` - 主分支，用于生产环境
- `app` - 开发分支，用于移动应用开发
- `web` - Web 功能分支

### 开发工作流
1. 从 `app` 分支创建功能分支
2. 开发完成后合并回 `app` 分支
3. 定期将 `app` 分支的更新合并到 `main` 分支

### 推送代码
```bash
# 确保在正确的分支上
git checkout app

# 推送当前分支到远程
git push

# 首次推送新分支
git push -u origin app
```

## 🔧 开发指南

### 移动端开发
1. 在 `mobile-app/src/components/` 中添加新组件
2. 在 `mobile-app/src/screens/` 中添加新页面
3. 使用 TypeScript 确保类型安全
4. 遵循 React Native 最佳实践
5. 使用 AsyncStorage 进行数据持久化

### 后端开发
1. 在 `backend/tingshu/api/v1/` 中添加新 API 端点
2. 在 `backend/tingshu/model/` 中定义数据库模型
3. 在 `backend/tingshu/middleware/` 中添加中间件
4. 使用 `config.DB` 全局变量访问数据库
5. 遵循 Go 标准项目结构和最佳实践

### 组件架构
- **screens/**: 页面级组件
- **components/**: 可复用 UI 组件
- **data/**: 数据层和模拟数据
- **services/**: API 服务层
- **types/**: TypeScript 类型定义

## 🎨 UI 设计

### 设计原则
- 移动优先设计
- 原生体验
- 流畅动画
- 一致的视觉语言
- 无障碍支持

### 主题色
- 主色: #FF6B35 (橙色)
- 背景: #F5F6F8 (浅灰)
- 文字: #333333 (深灰)
- 辅助: #999999 (中灰)

## 📊 性能优化

### 移动端优化
- 使用 FlatList 进行长列表优化
- 图片懒加载
- 组件 memo 化
- 避免不必要的重渲染
- 使用原生驱动动画

## 🔐 环境配置

### 移动端环境变量
在 `mobile-app/.env` 中配置：

```env
API_BASE_URL=http://localhost:8080
```

### 后端环境变量
在 `backend/.env` 中配置：

```env
# 服务器配置
SERVER_HOST=localhost
SERVER_PORT=8080

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=tingshu_db
DB_SSL_MODE=disable

# Redis 配置
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 认证
JWT_SECRET=your_jwt_secret_key

# AI 功能 (可选)
GEMINI_API_KEY=your_gemini_api_key
```

## 🚢 部署

### Android 部署
```bash
cd mobile-app

# 生成签名密钥
keytool -genkey -v -keystore release-key.keystore -alias release -keyalg RSA -keysize 2048 -validity 10000

# 构建发布版本
cd android && ./gradlew assembleRelease
```

### iOS 部署
```bash
cd mobile-app

# 在 Xcode 中配置签名和证书
# 通过 Xcode Archive 生成 ipa 文件
```

## 📈 后续规划

1. **音频功能**: 实现完整的音频播放和控制
2. **搜索功能**: 实现实时搜索和筛选
3. **用户系统**: 用户认证和个人数据管理
4. **社交功能**: 评论、分享、关注
5. **离线支持**: 下载和离线播放
6. **推荐系统**: 基于用户行为的智能推荐

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

MIT License