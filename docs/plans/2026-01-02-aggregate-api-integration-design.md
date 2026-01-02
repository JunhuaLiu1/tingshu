# 聚合接口与前端对齐设计

日期: 2026-01-02  
状态: Draft

## 背景
当前移动端仍大量依赖 mock 数据，且与后端接口存在不一致（如 rankings 路由、health 路由等），导致联调时出现 404 或功能不可用。同时首页、搜索、历史需要多次请求与拼装，前端复杂度高、可维护性差。

## 目标
- 以后端为准完成接口对齐，前端改为消费真实后端数据
- 新增后端聚合接口，降低前端拼装复杂度
- 覆盖首页、搜索、播放器、历史的真实数据链路
- 搜索聚合内部库与外部音源，返回统一列表并可区分来源
- 历史列表后端优先，前端本地回退

## 非目标
- 不引入鉴权/权限控制
- 不重构播放进度持久化或数据存储模型
- 不做 UI 视觉改版
- 不进行数据库迁移或大版本依赖升级

## 方案选择
选择“后端聚合 + 前端薄消费”方案：
- 新增 `/api/v1/home`、`/api/v1/search`、`/api/v1/history`
- 复用现有基础接口（`/books`、`/rankings`、`/categories`、`/sources`）
- 前端改为统一消费聚合结果，移除 mock 数据

## 架构设计
### 后端
- `GET /api/v1/home`
  - 返回 `sections` 结构：`hero`、`editors_picks`、`categories`、`rankings`
  - `hero`/`editors_picks` 来自 `books`，按 `play_count` 降序拆分
  - `rankings` 来自 `rankings?period=daily`
- `GET /api/v1/search?q=...`
  - 内部库搜索 + 外部音源（ximalaya）并行
  - 统一映射为 `items[]`，每项包含 `source_id`/`source_type`
- `GET /api/v1/history`
  - 返回最小进度列表：`book_id`/`episode_id`/`position`/`duration`/`source_id`
  - 进度保存请求新增 `source_id` 字段，缺失时默认 `internal`

### 前端
- `HomeScreen` 请求 `/home`，解析 `sections` 下发给 `HeroCarousel/EditorsPick/CategoryTabs/Rankings`
- 搜索页请求 `/search` 并渲染统一 `items[]` 列表，根据 `source_id` 选择播放器详情接口
- 历史页调用 `/history`，失败时回退本地 AsyncStorage
- 更新 README 与环境变量说明，以 `EXPO_PUBLIC_API_URL` 为准

## 数据流
1) 首页 -> `/home` -> 后端聚合 -> `sections` -> 组件渲染  
2) 搜索 -> `/search` -> 合并内部/外部结果 -> `items[]` -> 点击跳转播放器  
3) 播放器 -> 根据 `source_id` 决定 `books` 或 `sources` 详情与音频地址  
4) 进度保存 -> `POST /playback/progress`（含 `source_id`）  
5) 历史 -> `/history` 失败时回退本地

## 错误处理与边界
- 聚合接口允许部分成功，失败子段不阻塞整体返回
- 搜索合并时处理 ID 冲突，统一输出字符串 ID
- 外部音源失败时仍返回内部库结果并标记 `meta`
- 历史接口失败时前端展示本地缓存与提示

## 安全与隐私
- 本轮不引入鉴权，接口为开发/内测用途
- 输出仅包含公开书籍信息与最小进度字段

## 测试与验证
- 后端手工验证 `/home`、`/search`、`/history` 响应结构与字段完整性
- 搜索同时有内部/外部结果时可正确合并
- 前端手动验证：首页/搜索/播放器/历史完整链路
- 可选：`cd backend && go test ./...`，`cd mobile-app && npm run lint`

## 发布与回滚
- 先上线后端聚合接口，保持旧接口不变
- 再切前端调用聚合接口
- 回滚：前端切回旧调用，后端删除聚合路由不影响旧接口

## 风险
- 外部音源不可用导致搜索结果缺失
- 内部数据不足导致首页内容稀疏
- 历史最小字段需前端补齐展示信息

## Open Questions
- 暂无
