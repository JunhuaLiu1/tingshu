# EtherAudio MVP 上线计划

## 项目概况

- **项目名称**: EtherAudio (极简听书)
- **前端**: React Native (Expo) - 已完成 ✅
- **后端**: Go + Gin - 待开发 🚧
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **目标**: 2-3 周内完成 MVP 上线

---

## 第一阶段：Supabase 配置与后端基础 (3-4 天)

### Day 1: Supabase 项目初始化

#### 1.1 创建 Supabase 项目
- [ ] 访问 https://supabase.com 创建新项目
- [ ] 记录项目 URL 和 API Keys (anon key, service_role key)
- [ ] 配置项目区域（建议选择离用户最近的区域）

#### 1.2 数据库表设计与创建
在 Supabase SQL Editor 中执行以下建表语句：

```sql
-- 用户表 (使用 Supabase Auth，扩展用户信息)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 分类表
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 书籍表
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url TEXT,
  category_id INTEGER REFERENCES categories(id),
  duration INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 章节表
CREATE TABLE episodes (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  episode_num INTEGER NOT NULL,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 播放历史表
CREATE TABLE play_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  episode_id INTEGER REFERENCES episodes(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0,
  duration INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  last_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 排行榜表
CREATE TABLE rankings (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, period)
);

-- 创建索引
CREATE INDEX idx_books_category ON books(category_id);
CREATE INDEX idx_episodes_book ON episodes(book_id);
CREATE INDEX idx_play_history_user ON play_history(user_id);
CREATE INDEX idx_play_history_book ON play_history(book_id);
CREATE INDEX idx_rankings_period ON rankings(period, rank);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_play_history_updated_at BEFORE UPDATE ON play_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 1.3 配置 Row Level Security (RLS)
```sql
-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和更新自己的资料
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 用户只能查看和管理自己的播放历史
CREATE POLICY "Users can view own history" ON play_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON play_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON play_history
  FOR UPDATE USING (auth.uid() = user_id);

-- 公开表允许所有人读取
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view books" ON books
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view episodes" ON episodes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view rankings" ON rankings
  FOR SELECT USING (true);
```

#### 1.4 配置 Storage Bucket
- [ ] 创建 `book-covers` bucket (公开访问)
- [ ] 创建 `audio-files` bucket (公开访问)
- [ ] 配置文件大小限制和允许的文件类型

#### 1.5 插入测试数据
```sql
-- 插入分类
INSERT INTO categories (name, description) VALUES
  ('玄幻', '玄幻修仙类小说'),
  ('都市', '都市生活类小说'),
  ('历史', '历史架空类小说'),
  ('科幻', '科幻未来类小说'),
  ('悬疑', '悬疑推理类小说');

-- 插入示例书籍（需要先上传封面到 Storage）
INSERT INTO books (title, author, description, cover_url, category_id, duration, play_count) VALUES
  ('斗破苍穹', '天蚕土豆', '三十年河东，三十年河西，莫欺少年穷！', 'https://your-supabase-url/storage/v1/object/public/book-covers/doupo.jpg', 1, 36000, 12580),
  ('全职高手', '蝴蝶蓝', '网游荣耀中被誉为教科书级别的顶尖高手', 'https://your-supabase-url/storage/v1/object/public/book-covers/quanzhi.jpg', 2, 28800, 9876);
```

### Day 2-3: Go 后端开发 - Supabase 集成

#### 2.1 更新后端配置
修改 `backend/.env`:
```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# JWT 配置（使用 Supabase JWT Secret）
JWT_SECRET=your-supabase-jwt-secret

# Redis 配置（可选，用于缓存）
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

#### 2.2 安装 Supabase Go 客户端
```bash
cd backend
go get github.com/supabase-community/supabase-go
go get github.com/supabase-community/postgrest-go
```

#### 2.3 创建 Supabase 客户端配置
创建 `backend/tingshu/config/supabase.go`:
```go
package config

import (
    "github.com/supabase-community/supabase-go"
)

var SupabaseClient *supabase.Client

func InitSupabase() error {
    client, err := supabase.NewClient(
        AppConfig.SupabaseURL,
        AppConfig.SupabaseAnonKey,
        nil,
    )
    if err != nil {
        return err
    }
    SupabaseClient = client
    return nil
}
```

#### 2.4 实现核心 API 端点

**必须实现的 API（按优先级）：**

1. **书籍相关** (`backend/tingshu/api/v1/books.go`)
   - `GET /api/v1/books` - 获取书籍列表（分页）
   - `GET /api/v1/books/:id` - 获取书籍详情
   - `GET /api/v1/books/:id/episodes` - 获取书籍章节

2. **分类相关** (`backend/tingshu/api/v1/categories.go`)
   - `GET /api/v1/categories` - 获取所有分类

3. **排行榜相关** (`backend/tingshu/api/v1/rankings.go`)
   - `GET /api/v1/rankings?period=daily` - 获取排行榜

4. **搜索相关** (`backend/tingshu/api/v1/search.go`)
   - `GET /api/v1/search?q=keyword` - 搜索书籍

5. **用户相关** (`backend/tingshu/api/v1/users.go`)
   - `POST /api/v1/auth/signup` - 用户注册
   - `POST /api/v1/auth/login` - 用户登录
   - `GET /api/v1/users/profile` - 获取用户信息
   - `PUT /api/v1/users/profile` - 更新用户信息

6. **播放历史** (`backend/tingshu/api/v1/history.go`)
   - `GET /api/v1/history` - 获取播放历史
   - `POST /api/v1/history` - 添加播放记录
   - `PUT /api/v1/history/:id` - 更新播放进度

#### 2.5 实现 JWT 认证中间件
更新 `backend/tingshu/middleware/middleware.go`，使用 Supabase JWT 验证。

### Day 4: 本地测试与调试

- [ ] 使用 Postman/Insomnia 测试所有 API 端点
- [ ] 验证 JWT 认证流程
- [ ] 测试数据库查询性能
- [ ] 修复发现的 bug

---

## 第二阶段：前后端联调 (2-3 天)

### Day 5: 前端 API 集成

#### 5.1 更新前端 API 配置
修改 `mobile-app/src/services/api.ts`:
```typescript
const apiClient = axios.create({
  baseURL: __DEV__ 
    ? 'http://localhost:8080/api/v1'  // 开发环境
    : 'https://your-backend-url.com/api/v1',  // 生产环境
  timeout: 10000,
});
```

#### 5.2 替换 AsyncStorage
将 `localStorage` 替换为 `@react-native-async-storage/async-storage`:
```bash
cd mobile-app
npm install @react-native-async-storage/async-storage
```

#### 5.3 实现 Supabase 认证集成
```bash
npm install @supabase/supabase-js
```

创建 `mobile-app/src/services/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Day 6-7: 功能测试与优化

- [ ] 测试用户注册/登录流程
- [ ] 测试书籍浏览和搜索
- [ ] 测试音频播放功能
- [ ] 测试播放历史记录
- [ ] 优化加载速度和用户体验
- [ ] 添加错误处理和加载状态

---

## 第三阶段：部署准备 (2-3 天)

### Day 8: 后端部署

#### 选项 A: 使用 Railway (推荐，简单快速)
1. [ ] 注册 Railway 账号
2. [ ] 连接 GitHub 仓库
3. [ ] 配置环境变量
4. [ ] 部署 Go 后端
5. [ ] 获取部署 URL

#### 选项 B: 使用 Fly.io
1. [ ] 安装 Fly CLI
2. [ ] 创建 `Dockerfile`:
```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY backend/ .
RUN go mod download
RUN go build -o main cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```
3. [ ] 运行 `fly launch`
4. [ ] 配置环境变量 `fly secrets set`
5. [ ] 部署 `fly deploy`

#### 选项 C: 使用 AWS/阿里云
- 配置 EC2/ECS 实例
- 设置 Nginx 反向代理
- 配置 SSL 证书

### Day 9: 移动应用构建

#### iOS 构建
```bash
cd mobile-app
# 使用 EAS Build (Expo Application Services)
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios
```

#### Android 构建
```bash
eas build --platform android
```

#### 或使用本地构建
```bash
# Android
npm run android -- --mode=release

# iOS (需要 Mac)
npm run ios -- --configuration Release
```

### Day 10: 测试与优化

- [ ] 在真实设备上测试 iOS 和 Android 版本
- [ ] 性能测试和优化
- [ ] 修复崩溃和严重 bug
- [ ] 准备应用商店素材（截图、描述、图标）

---

## 第四阶段：上线发布 (2-3 天)

### Day 11-12: App Store 提交

#### iOS App Store
1. [ ] 注册 Apple Developer 账号（$99/年）
2. [ ] 在 App Store Connect 创建应用
3. [ ] 准备素材：
   - 应用图标 (1024x1024)
   - 截图 (多种设备尺寸)
   - 应用描述和关键词
   - 隐私政策 URL
4. [ ] 上传构建版本
5. [ ] 提交审核（通常需要 1-3 天）

#### Android Google Play
1. [ ] 注册 Google Play Developer 账号（$25 一次性）
2. [ ] 创建应用
3. [ ] 准备素材：
   - 应用图标 (512x512)
   - 功能图片
   - 截图
   - 应用描述
   - 隐私政策 URL
4. [ ] 上传 APK/AAB
5. [ ] 提交审核（通常几小时到 1 天）

### Day 13: 监控与反馈

- [ ] 配置 Sentry 错误监控
- [ ] 配置 Google Analytics / Firebase Analytics
- [ ] 设置用户反馈渠道
- [ ] 准备运营和推广计划

---

## 关键技术决策

### 为什么选择 Supabase？
- ✅ 开箱即用的认证系统
- ✅ 实时数据库功能
- ✅ 内置文件存储
- ✅ 自动生成 REST API
- ✅ 免费额度足够 MVP 使用
- ✅ 易于扩展

### 架构图
```
┌─────────────────┐
│  React Native   │
│   Mobile App    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      ┌──────────────┐
│   Go Backend    │◄────►│  Supabase    │
│   (Railway/     │      │  - PostgreSQL│
│    Fly.io)      │      │  - Auth      │
└─────────────────┘      │  - Storage   │
                         └──────────────┘
```

---

## MVP 功能清单

### 必须有（P0）
- [x] 用户注册/登录
- [x] 浏览书籍列表
- [x] 查看书籍详情
- [x] 分类浏览
- [x] 搜索功能
- [x] 音频播放
- [x] 播放历史记录

### 应该有（P1）
- [ ] 排行榜
- [ ] 用户个人中心
- [ ] 播放进度同步
- [ ] 收藏功能

### 可以有（P2）
- [ ] 评论功能
- [ ] 分享功能
- [ ] 推送通知
- [ ] 离线下载

---

## 预算估算

### 开发阶段（免费）
- Supabase: 免费版（500MB 数据库，1GB 文件存储）
- Railway/Fly.io: 免费额度
- 开发工具: 全部免费

### 上线后（每月）
- Supabase Pro: $25/月（可选，流量大时升级）
- Railway: $5-20/月（根据使用量）
- Apple Developer: $99/年
- Google Play: $25（一次性）
- 域名: $10-15/年

**总计**: 首月约 $150，之后每月 $30-50

---

## 风险与应对

### 技术风险
1. **Supabase 性能问题**
   - 应对：使用 Redis 缓存热门数据
   - 应对：优化数据库查询和索引

2. **音频文件存储成本**
   - 应对：使用 CDN 加速
   - 应对：考虑使用第三方音频托管服务

3. **移动应用审核被拒**
   - 应对：仔细阅读应用商店指南
   - 应对：准备完整的隐私政策和用户协议

### 业务风险
1. **版权问题**
   - 应对：确保所有内容有合法授权
   - 应对：添加版权声明和 DMCA 流程

2. **用户增长缓慢**
   - 应对：准备推广计划
   - 应对：收集用户反馈快速迭代

---

## 检查清单

### 开发完成前
- [ ] 所有 API 端点已实现并测试
- [ ] 前后端联调通过
- [ ] 错误处理完善
- [ ] 加载状态和空状态处理
- [ ] 代码已提交到 Git

### 部署前
- [ ] 环境变量已配置
- [ ] 数据库已迁移
- [ ] 测试数据已准备
- [ ] SSL 证书已配置
- [ ] 备份策略已制定

### 上线前
- [ ] 应用图标和启动页
- [ ] 隐私政策和用户协议
- [ ] 应用商店素材准备完毕
- [ ] 错误监控已配置
- [ ] 分析工具已集成

---

## 下一步行动

### 立即开始（今天）
1. 创建 Supabase 项目
2. 执行数据库建表脚本
3. 配置 Storage Buckets
4. 更新后端 `.env` 配置

### 本周完成
1. 实现所有后端 API
2. 前后端联调
3. 本地测试通过

### 下周完成
1. 部署后端到生产环境
2. 构建移动应用
3. 提交应用商店审核

---

## 联系与支持

- Supabase 文档: https://supabase.com/docs
- Go Gin 文档: https://gin-gonic.com/docs/
- React Native 文档: https://reactnative.dev/docs/getting-started
- Expo 文档: https://docs.expo.dev/

---

**最后更新**: 2025-12-08
**预计完成时间**: 2-3 周
**当前状态**: 📋 计划制定完成，准备开始执行
