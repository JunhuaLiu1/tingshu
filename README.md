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
├── backend/                   # 后端 API 服务
│   ├── src/                  # 后端源代码
│   ├── migrations/           # 数据库迁移
│   └── Cargo.toml            # Rust 依赖配置
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

### 后端 (Rust)
- **框架**: Actix-web
- **数据库**: PostgreSQL + SQLx
- **认证**: JWT
- **API**: RESTful API

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

## 🔧 开发指南

### 移动端开发
1. 在 `mobile-app/src/components/` 中添加新组件
2. 在 `mobile-app/src/screens/` 中添加新页面
3. 使用 TypeScript 确保类型安全
4. 遵循 React Native 最佳实践
5. 使用 AsyncStorage 进行数据持久化

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

### 环境变量
在 `mobile-app/.env` 中配置：

```env
API_BASE_URL=http://localhost:8080
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