# 📱 EtherAudio - 极简听书

这是一个专为移动设备设计的听书 React Native 应用，提供原生移动体验。

## 🏗️ 项目架构

```
tingshu/
├── mobile-app/                # React Native 应用 (Expo)
│   ├── app/                   # Expo Router 路由
│   │   ├── (tabs)/           # 底部标签导航
│   │   │   ├── _layout.tsx   # 标签布局配置
│   │   │   ├── index.tsx     # 首页路由
│   │   │   ├── search.tsx    # 搜索页路由
│   │   │   ├── player.tsx    # 播放器路由
│   │   │   ├── history.tsx   # 历史路由
│   │   │   └── profile.tsx   # 个人中心路由
│   │   └── _layout.tsx       # 根布局配置
│   ├── src/                   # 源代码
│   │   ├── screens/          # 页面组件
│   │   │   ├── HomeScreen.tsx      # 首页
│   │   │   ├── SearchScreen.tsx    # 搜索页
│   │   │   ├── PlayerScreen.tsx    # 播放器
│   │   │   ├── HistoryScreen.tsx   # 历史记录
│   │   │   └── ProfileScreen.tsx   # 个人中心
│   │   ├── components/       # UI 组件
│   │   │   ├── common/       # 通用组件
│   │   │   │   ├── Button.tsx      # 按钮组件
│   │   │   │   ├── Toast.tsx       # Toast 提示
│   │   │   │   ├── Loading.tsx     # 加载组件
│   │   │   │   ├── EmptyState.tsx  # 空状态组件
│   │   │   │   └── CachedImage.tsx # 图片组件
│   │   │   ├── HeroCarousel.tsx    # 首页轮播
│   │   │   ├── CategoryTabs.tsx    # 分类标签
│   │   │   ├── EditorsPick.tsx     # 编辑推荐
│   │   │   └── Rankings.tsx        # 排行榜
│   │   ├── theme/            # 设计系统
│   │   │   ├── tokens.ts     # 设计令牌
│   │   │   └── styles.ts     # 样式工具
│   │   ├── contexts/         # React Context
│   │   │   └── ToastContext.tsx    # Toast 上下文
│   │   ├── utils/            # 工具函数
│   │   │   └── responsive.ts      # 响应式工具
│   │   ├── data/             # 数据层
│   │   │   └── mockData.ts        # 模拟数据
│   │   ├── services/         # 服务层
│   │   │   └── api.ts             # API 服务
│   │   └── types/            # 类型定义
│   │       └── index.ts          # TypeScript 类型
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
├── spec/                     # 规范文档
│   └── spec1_front_opti/    # 前端 UI 优化文档
│       ├── PLAN.md          # UI 优化战略规划
│       ├── TASK.md          # UI 优化执行清单
│       ├── RESPONSIVE_TEST.md  # 响应式测试清单
│       └── SUMMARY.md       # 优化总结报告
├── AGENTS.md                 # AI Agent 开发指南
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

### 移动端 (React Native + Expo)
- **框架**: Expo ~54.0.27 + React Native 0.81.5
- **语言**: TypeScript
- **路由**: Expo Router (基于文件的路由)
- **导航**: @react-navigation/native 7.x + @react-navigation/bottom-tabs
- **图标**: @expo/vector-icons (MaterialIcons)
- **网络**: Axios
- **存储**: @react-native-async-storage/async-storage
- **音频**: @react-native-community/slider
- **设计系统**: 自定义 Design Tokens
- **UI 组件**: 自定义通用组件库

### 后端 (Go)
- **框架**: Gin Web Framework
- **数据库**: PostgreSQL (Supabase)
- **缓存**: Redis
- **认证**: JWT
- **API**: RESTful API
- **配置管理**: 环境变量

## 📱 功能特性

### ✅ 已实现功能
- ✅ 原生移动体验（Expo）
- ✅ 统一设计系统（Design Tokens）
- ✅ 通用组件库（Button, Toast, Loading, EmptyState, CachedImage）
- ✅ 精美的轮播组件（票据式设计）
- ✅ 分类标签展示
- ✅ 编辑推荐书籍
- ✅ 热门排行榜
- ✅ 响应式布局（支持多种屏幕尺寸）
- ✅ 平滑动画效果
- ✅ 统一视觉风格（阴影、圆角、间距）
- ✅ 完善的交互反馈（Toast 提示）
- ✅ 性能优化（FlatList、图片缓存）
- ✅ 导航结构（Expo Router + Bottom Tabs）
- ✅ Go 后端 API 服务
- ✅ Supabase PostgreSQL 集成
- ✅ 统一 API 响应格式

### 🔄 计划功能
- 🔄 音频播放功能（集成 expo-av）
- 🔄 搜索功能完善
- 🔄 用户认证系统
- 🔄 收藏功能
- 🔄 播放历史同步
- 🔄 离线缓存
- 🔄 推送通知
- 🔄 暗黑模式
- 🔄 无障碍功能

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
- **components/common/**: 通用 UI 组件（Button, Toast, Loading, EmptyState, CachedImage）
- **components/**: 业务组件（HeroCarousel, CategoryTabs, EditorsPick, Rankings）
- **theme/**: 设计系统（tokens, styles）
- **contexts/**: React Context（ToastContext）
- **utils/**: 工具函数（responsive）
- **data/**: 数据层和模拟数据
- **services/**: API 服务层
- **types/**: TypeScript 类型定义

## 🎨 UI 设计系统

### 设计原则
- 移动优先设计
- 原生体验
- 流畅动画
- 一致的视觉语言
- 无障碍支持

### 设计令牌（Design Tokens）
```typescript
// 颜色系统
colors: {
  primary: '#FF6B35',
  background: '#F5F6F8',
  surface: '#FFFFFF',
  text: { primary: '#333333', secondary: '#666666', tertiary: '#999999' }
}

// 间距系统（基于 8px 网格）
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 }

// 字体系统
typography: { h1: 24, h2: 20, h3: 18, body: 16, caption: 14, small: 12 }

// 圆角系统
radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 }

// 阴影系统
shadows: { sm: {...}, md: {...}, lg: {...} }
```

### 通用组件库
- **Button**: 3 种变体（primary, secondary, outline）、3 种尺寸、loading/disabled 状态
- **Toast**: 4 种类型（success, error, info, warning）、3 种位置、自动消失
- **Loading**: 全屏/局部 Loading、自定义文案
- **EmptyState**: 自定义图标、标题、副标题、操作按钮
- **CachedImage**: 加载占位符、错误占位符、渐进式加载

### 使用示例
```typescript
// 使用设计令牌
import { tokens } from '../theme/tokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.h2,
    color: tokens.colors.text.primary,
  },
});

// 使用通用组件
import Button from '../components/common/Button';
import { useToast } from '../contexts/ToastContext';

const { showToast } = useToast();

<Button variant="primary" onPress={() => {
  showToast({ type: 'success', message: '操作成功' });
}}>
  确认
</Button>
```

## 📊 性能优化

### 移动端优化
- ✅ 使用 FlatList 进行长列表优化（removeClippedSubviews, maxToRenderPerBatch）
- ✅ 图片懒加载和缓存（CachedImage 组件）
- ✅ 组件 memo 化
- ✅ 避免不必要的重渲染
- ✅ 使用原生驱动动画
- ✅ 页面懒加载（Expo Router lazy）
- ✅ 响应式适配（responsive 工具函数）

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

## 🎯 UI/UX 优化

### 已完成优化（2025-12-08）

#### 基础设施建设
- ✅ 创建设计令牌系统（颜色、间距、字体、圆角、阴影）
- ✅ 封装 5 个通用组件（Button, Toast, Loading, EmptyState, CachedImage）
- ✅ 创建响应式工具函数

#### 页面重构
- ✅ HomeScreen: 应用设计系统，优化搜索栏
- ✅ SearchScreen: 集成通用组件，添加 Toast 提示
- ✅ PlayerScreen: 优化响应式适配，添加交互反馈
- ✅ HistoryScreen: 优化列表性能，添加空状态
- ✅ ProfileScreen: 统一样式，添加操作反馈

#### 性能优化
- ✅ FlatList 性能优化（removeClippedSubviews, maxToRenderPerBatch）
- ✅ 图片加载优化（CachedImage 组件）
- ✅ 页面切换动效优化

#### 关键成果
- 设计令牌覆盖率: **100%**
- 硬编码样式清除率: **100%**
- Toast 提示覆盖率: **100%**
- 代码减少: **30%**

### 优化文档
详细的 UI 优化文档位于 `spec/spec1_front_opti/` 目录：
- **PLAN.md**: UI 优化战略规划
- **TASK.md**: UI 优化执行清单（23 个任务）
- **RESPONSIVE_TEST.md**: 响应式测试清单
- **SUMMARY.md**: 优化总结报告

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