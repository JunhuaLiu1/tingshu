# Repository Guidelines

## Project Structure & Module Organization
本仓库包含两个主要模块：`mobile-app/`（React Native + Expo）和 `backend/`（Go + Gin）。移动端源码在 `mobile-app/src/`，常见入口在 `mobile-app/app/`（Expo Router）。后端入口在 `backend/cmd/main.go`，API 代码在 `backend/tingshu/api/`。规范文档位于 `spec/`，可作为改动参考。

## Build, Test, and Development Commands
- 移动端开发：`cd mobile-app && npm install` 安装依赖；`npm start` 启动 Metro；`npm run android|ios|web` 运行对应平台。
- 代码检查：`cd mobile-app && npm run lint`（Expo ESLint）。
- 后端开发：`cd backend && go run cmd/main.go` 启动服务；`go build -o bin/tingshu cmd/main.go` 构建二进制；`go test ./...` 运行后端测试。

## Coding Style & Naming Conventions
TypeScript 使用 2 空格缩进，组件文件采用 `PascalCase`，hooks/函数使用 `camelCase`。Go 代码遵循 `gofmt`，API 结构体字段使用 snake_case 的 JSON 标签。新增 API 路由请注册在 `backend/tingshu/api/routes.go`。

## Testing Guidelines
后端测试使用 `go test`，建议为新增 API 增加覆盖。移动端当前无自动化测试，变更后至少运行 `npm run lint` 并手动验证核心页面（首页/搜索/播放器/历史/个人中心）。

## Commit & Pull Request Guidelines
提交信息以简短中文为主，可使用前缀示例：`fix ...`、`docs：...`、`spec4:...`。PR 需要描述变更动机、影响范围与验证方式；若涉及 UI，附上截图或录屏；关联相关 Issue（如有）。

## Configuration & Security Tips
后端环境变量基于 `backend/.env.example`，需配置 Supabase 连接信息。移动端默认使用 `EXPO_OFFLINE=1`，如需联网调试请明确说明。数据库查询需参数化，避免 SQL 注入风险。
