# 🎧 EtherAudio（听书）

一款跨平台有声书聚合应用，聚合多个音频源，提供统一的搜索和播放体验。

## ✨ 功能特性

- 🔍 **多源聚合搜索** - 一次搜索，查询多个有声书平台
- 🎵 **统一播放器** - 支持后台播放、进度记忆、播放速度调节
- 📚 **收藏管理** - 收藏喜爱的有声书，支持云端同步
- 📖 **播放历史** - 自动记录播放历史，随时续听
- 🔐 **用户系统** - 注册登录，数据云端同步

## 🏗️ 项目结构

```
tingshu/
├── mobile-app/          # 移动端应用 (React Native + Expo)
│   ├── app/             # Expo Router 页面路由
│   ├── src/             # 源代码
│   │   ├── components/  # UI 组件
│   │   ├── contexts/    # React Context
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── services/    # API 服务
│   │   ├── theme/       # 设计系统
│   │   └── types/       # TypeScript 类型定义
│   └── assets/          # 静态资源
│
├── backend/             # 后端服务 (Go + Gin)
│   ├── cmd/             # 入口文件
│   ├── tingshu/
│   │   ├── api/         # API 路由处理
│   │   ├── config/      # 配置管理
│   │   ├── middleware/  # 中间件
│   │   ├── model/       # 数据模型
│   │   ├── service/     # 业务逻辑
│   │   └── source/      # 音源适配器
│   └── migrations/      # 数据库迁移
│
├── docs/                # 项目文档
│   ├── specs/           # 技术规格文档
│   └── plans/           # 开发计划
│
└── DB/                  # 数据库初始化脚本
```

## 🎵 支持的音频源

| 音频源 | 状态 | 说明 |
|--------|------|------|
| 喜马拉雅 | ✅ | 国内最大有声书平台 |
| 酷我音乐 | ✅ | 酷我听书频道 |
| 猫耳FM | ✅ | 二次元音频社区 |
| 书音FM | ✅ | 免费有声书资源 |
| 幻听网 | ✅ | 有声小说资源 |
| 听书78 | ✅ | 有声书聚合站 |
| 听书网 | ✅ | 有声小说资源 |
| 乐听8 | ✅ | 有声书资源 |

## 🛠️ 技术栈

### 移动端
- **框架**: React Native 0.81 + Expo SDK 54
- **路由**: Expo Router
- **状态管理**: React Context + Hooks
- **音频播放**: expo-av
- **UI 设计**: 自定义设计系统

### 后端
- **语言**: Go 1.24
- **框架**: Gin
- **数据库**: MySQL (GORM)
- **认证**: JWT

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Go 1.24+
- MySQL 8.0+
- Expo CLI

### 后端启动

```bash
# 进入后端目录
cd backend

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 配置数据库连接等信息
vim .env

# 启动服务
go run cmd/main.go
```

后端服务默认运行在 `http://localhost:8080`

### 移动端启动

```bash
# 进入移动端目录
cd mobile-app

# 安装依赖
npm install

# 配置环境变量
echo "EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1" > .env

# 启动开发服务器
npm start
```

然后使用 Expo Go 扫码或运行模拟器：
- iOS: `npm run ios`
- Android: `npm run android`

## 📝 开发指南

### 代码规范

- **TypeScript/React Native**: 2 空格缩进，组件用 PascalCase
- **Go**: 提交前运行 `gofmt -w .`，导出类型用 PascalCase

### 常用命令

```bash
# 后端测试
cd backend && go test ./...

# 前端代码检查
cd mobile-app && npm run lint

# 构建后端二进制
cd backend && go build -o bin/tingshu cmd/main.go
```

### 提交规范

使用中文提交信息，格式：`类型: 描述`

```
feat: 新增播放历史功能
fix: 修复音频播放卡顿问题
docs: 更新 README 文档
refactor: 重构音源管理模块
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

详细的代码规范和开发指南请参考 [AGENTS.md](./AGENTS.md)。
