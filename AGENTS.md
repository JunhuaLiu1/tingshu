# Repository Guidelines

## 项目结构与模块组织
本仓库包含两个主要模块：`mobile-app/`（React Native + Expo）和 `backend/`（Go + Gin）。移动端源码在 `mobile-app/src/`，路由入口在 `mobile-app/app/`（Expo Router）。后端入口在 `backend/cmd/main.go`，API 路由在 `backend/tingshu/api/`。技术规格文档在 `docs/specs/`，可作为实施参考。

## 构建、测试与开发命令

### 移动端（React Native + Expo）
- **安装依赖**：`cd mobile-app && npm install`
- **开发启动**：`npm start`（Metro 打包器，默认 `EXPO_OFFLINE=1`）
- **运行平台**：`npm run android|ios|web`
- **代码检查**：`npm run lint`（运行 Expo ESLint）
- **测试**：暂无自动化测试，需手动验证核心页面（首页/搜索/播放器/历史/个人中心）

### 后端（Go + Gin）
- **启动服务**：`cd backend && go run cmd/main.go`
- **构建二进制**：`go build -o bin/tingshu cmd/main.go`
- **运行所有测试**：`go test ./...`
- **运行单个测试**：`go test ./path/to/package -run TestFunctionName`（如 `go test ./tingshu/source -run TestKuwoSearch`）
- **测试覆盖率**：`go test -cover ./...`
- **详细输出**：`go test -v ./...`
- **竞态检测**：`go test -race ./...`

## 代码风格与命名规范

### TypeScript/React Native（mobile-app/）
- **缩进**：2 空格
- **文件命名**：组件用 `PascalCase.tsx`，hooks 用 `camelCase.ts`
- **组件命名**：`PascalCase`（如 `HomeScreen`、`HeroCarousel`）
- **函数/hooks**：`camelCase`（如 `useAudioPlayer`、`loadEpisode`）
- **常量**：全局用 `UPPER_SNAKE_CASE`，模块级用 `camelCase`
- **主题变量**：使用 `src/theme/tokens.ts` - 通过 `tokens.colors.primary`、`tokens.spacing.md` 访问
- **导入顺序**：先第三方，后本地（使用 `@/` 别名）
- **类型定义**：在 `src/types/index.ts` 导出接口，使用联合类型兼容不同字段名（如 `coverUrl | cover_url`）
- **错误处理**：try-catch 包裹，音频源提供 fallback URL，用户友好的错误提示

### Go（backend/）
- **格式化**：提交前必须运行 `gofmt -w .`
- **命名**：导出类型/函数用 `PascalCase`，私有用 `camelCase`
- **包名**：小写单词（如 `source`、`api`、`middleware`）
- **接口命名**：简单名称 + 行为描述（如 `Source` 而非 `ISource`）
- **错误处理**：必须返回错误，禁止用 `_` 忽略错误。使用 `errors.New()` 或 `fmt.Errorf()` 自定义错误
- **API 响应**：使用标准 `APIResponse` 结构（`code`、`message`、`data` 字段）
- **JSON 标签**：结构体字段用 `snake_case`（如 `json:"user_id"`）
- **常量**：定义在结构体外，使用描述性名称
- **音源实现**：每个音源在独立文件实现 `source.Source` 接口（如 `kuwo.go`、`ximalaya.go`）

## API 约定

### 后端路由
- 在 `backend/tingshu/api/routes.go` 注册新路由，归入 `/api/v1` 分组
- 成功响应使用 `api.Success(c, data)`
- 错误响应使用 `api.Error(c, code, message)`
- RESTful 命名：`GET /books/:id`、`POST /auth/login` 等

### 前端 API 调用
- 所有 HTTP 请求使用 `src/services/api.ts`
- 按功能分组：`authApi`、`bookApi`、`sourceApi`、`playbackApi` 等
- 通过拦截器自动添加 AsyncStorage 中的 token
- 返回类型：`Promise<ApiResponse<T>>`

## 测试规范
- **后端**：创建 `*_test.go` 文件，测试成功与错误路径
- **前端**：UI 变更需手动测试，提交前必须 lint
- **覆盖率**：关键路径（音源解析器、API 处理器）目标 >70%

## 提交与 Pull Request 规范
- **提交信息**：优先中文，使用前缀：`fix:`、`feat:`、`docs:`、`refactor:`、`test:`
- **示例**：`fix: 音频代理超时问题`、`spec2: 实现音源统一接口`
- **PR 描述**：包含变更动机、影响范围、验证步骤
- **UI 变更**：附上截图或录屏
- **关联文档**：链接 `docs/specs/` 中的相关规格（如 spec3、spec4）

## 配置与安全
- **环境变量**：后端使用 `backend/.env.example` 作为模板，禁止提交实际 `.env` 文件
- **Supabase**：仅在后端环境变量配置连接信息
- **认证**：JWT token 存储在 AsyncStorage，后端通过中间件验证
- **API 地址**：前端使用 `EXPO_PUBLIC_API_URL` 环境变量，默认 `http://localhost:8080/api/v1`
- **安全**：使用 GORM 参数化 SQL 查询，禁止用用户输入拼接 SQL
- **敏感数据**：禁止明文记录密码、token、音频 URL

## 设计系统（前端）
- 使用 `src/theme/tokens.ts` 的设计 token 进行样式配置
- 间距基于 8px 网格：`xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40`
- 配色方案：Primary `#FF6B35`、Background `#F5F6F8`、Surface `#FFFFFF`
- 字号：H1 (24px)、H2 (20px)、H3 (18px)、Body (16px)
- 圆角：sm (8)、md (12)、lg (16)、xl (24)、full (9999)
- 触控反馈：使用 `activeOpacity={tokens.opacity.active}`
- 阴影：预定义 sm/md/lg elevation 阴影

## 常用模式
- **Hooks**：自定义 hooks 在 `src/hooks/`（如 `useAudioPlayer`、`usePlayHistory`）
- **Context**：全局状态使用 React Context（AuthContext、ToastContext）
- **Services**：业务逻辑在 `src/services/`（api.ts、audioCache.ts、supabase.ts）
- **Components**：共享组件在 `src/components/common/`（Button、Loading、Toast、EmptyState）
- **Utils**：纯函数在 `src/utils/`（debounce.ts、responsive.ts、appVersion.ts）

## 快速验证清单
变更完成后：
1. 后端：`cd backend && go test ./...`（如存在测试）
2. 前端：`cd mobile-app && npm run lint`
3. 启动后端：`cd backend && go run cmd/main.go`
4. 启动前端：`cd mobile-app && npm start`
5. 手动测试受影响功能
6. IDE 中检查 TypeScript 错误

## 故障排查
- **Metro 打包器卡住**：清除缓存：`npx expo start -c`
- **Go 导入缺失**：在 backend 运行 `go mod tidy`
- **TypeScript 错误**：检查 `src/types/index.ts` 类型定义
- **API 401 错误**：验证 AsyncStorage 中的 JWT token 和后端中间件
- **播放器问题**：检查 `useAudioPlayer` hook 和 `audioCache` 服务
