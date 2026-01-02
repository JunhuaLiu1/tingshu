# Spec 2: 聚合接口与前端对齐

- Status: Draft
- Owner: liujunhua
- Created: 2026-01-02
- Related Design: `docs/plans/2026-01-02-aggregate-api-integration-design.md`
- Target Release: TBD

## 1. Background
移动端仍依赖 mock 数据，并与后端接口存在不一致（如 rankings 路由、health 路由、搜索入口），导致联调时 404 或功能不可用。同时首页/搜索/历史需要多次请求与拼装，前端复杂度高、可维护性差。

## 2. Goals & Non-Goals
### Goals
- 以后端为准完成接口对齐，移动端消费真实数据
- 新增 `/api/v1/home`、`/api/v1/search`、`/api/v1/history` 聚合接口
- 搜索聚合内部库与外部音源，返回统一 `items[]` 列表并区分来源
- 历史列表后端优先，前端失败时回退本地缓存

### Non-Goals
- 不引入鉴权、权限控制或用户体系
- 不进行数据库迁移或播放进度存储重构
- 不做 UI 视觉改版

## 3. Users / Use Cases
- 普通用户浏览首页推荐内容
- 搜索书籍并进入播放器
- 查看播放历史并继续播放

## 4. Requirements
### Functional Requirements
- FR-1: 提供 `GET /api/v1/home`，返回 `sections` 结构，包含 `hero/editors_picks/categories/rankings`
- FR-2: `GET /api/v1/search` 同时查询内部库与外部音源，合并后返回单一 `items[]` 列表
- FR-3: `GET /api/v1/history` 返回最小进度列表（含 `source_id`）
- FR-4: `POST /api/v1/playback/progress` 支持 `source_id`，缺失时默认 `internal`
- FR-5: 移动端首页/搜索/历史移除 mock 数据，改用聚合接口
- FR-6: 历史接口失败时前端回退 AsyncStorage

### Non-Functional Requirements
- NFR-1: 外部音源失败时仍返回内部搜索结果（部分成功）
- NFR-2: 聚合接口响应结构稳定，字段可选但不破坏兼容
- NFR-3: 旧接口继续可用（`/books`、`/rankings`、`/sources`）

### Assumptions / Constraints
- `user_id` 固定使用 `default`
- 外部音源仅聚合 ximalaya（后续可扩展）
- 不引入新依赖与大版本升级

## 5. Proposed Solution
新增后端聚合接口，使前端只需消费统一结果。`/home` 在服务端完成首页模块拆分；`/search` 统一内部库与外部音源结果并合并排序；`/history` 直接提供最小进度列表并携带来源信息。前端改为消费聚合接口，组件仅渲染，不再拼装数据。

### Components
- Backend Aggregator: `home.go`, `search.go`, `history.go`
- Source Mapper: 统一 SearchItem 映射与排序策略
- Frontend API Layer: `mobile-app/src/services/api.ts`
- UI Data Wiring: `HomeScreen`, `SearchScreen`, `HistoryScreen`, 相关组件

### Decision Rationale
后端聚合降低前端复杂度，减少接口不一致带来的联调问题；同时保留现有基础接口，风险可控。

### Alternatives Considered
- 前端继续多接口拼装：改动小但长期维护成本高
- 新增 `/home` 但不改搜索/历史：数据链路不统一

## 6. Architecture & Data Flow
```
Mobile App
  |-- /api/v1/home ------> Home Aggregator -> books/categories/rankings
  |-- /api/v1/search ----> Search Aggregator -> books + ximalaya
  |-- /api/v1/history ---> Progress Store
```

数据流：
1) 首页请求 `/home` -> 返回 `sections`
2) 搜索请求 `/search` -> 合并结果返回 `items[]`
3) 播放器根据 `source_id` 选择内部书籍详情或音源详情
4) 保存进度时写入 `source_id`
5) 历史请求 `/history`，失败回退本地

## 7. Data Model / Storage
### PlaybackProgress（新增字段）
- `source_id` string（internal/ximalaya）

### SearchItem（新结构）
- `id` string
- `title` string
- `author` string
- `cover_url` string
- `description` string
- `play_count` number
- `source_id` string
- `source_type` string (`internal` | `ximalaya`)

无数据库迁移，播放进度仍保存在内存结构中。

## 8. API / Interface Contracts
### 8.1 GET /api/v1/home
Response:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sections": [
      {"type": "hero", "title": "今日推荐", "items": [], "meta": {"limit": 3}},
      {"type": "editors_picks", "title": "热门书籍", "items": [], "meta": {"limit": 10}},
      {"type": "categories", "title": "分类", "items": [], "meta": {"limit": 0}},
      {"type": "rankings", "title": "热门排行", "items": [], "meta": {"period": "daily", "limit": 10}}
    ],
    "meta": {
      "partial": false,
      "failed_sections": []
    }
  }
}
```

### 8.2 GET /api/v1/search?q=keyword
Response:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "meta": {
      "sources": ["internal", "ximalaya"],
      "sources_failed": []
    }
  }
}
```

排序规则：按 `play_count` 降序；缺失时视为 0；同分时 `internal` 优先，其次按 `title` 字典序。

### 8.3 GET /api/v1/history?user_id=default
Response:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "book_id": "123",
        "episode_id": "456",
        "position": 120.5,
        "duration": 1800,
        "source_id": "internal"
      }
    ],
    "meta": {"user_id": "default"}
  }
}
```

### 8.4 POST /api/v1/playback/progress
Request:
```json
{
  "book_id": "123",
  "episode_id": "456",
  "position": 120.5,
  "duration": 1800,
  "source_id": "ximalaya"
}
```

Error Semantics:
- 400: 缺少 `q` 或必要字段
- 500: 内部库查询失败
- 200 + `meta.sources_failed`: 外部音源失败但内部结果正常

## 9. Error Handling & Edge Cases
- `/home` 允许部分成功，`meta.partial=true` 时前端仅渲染可用 sections
- `/search` 外部失败时不返回错误码，仅标记 `sources_failed`
- 旧进度数据缺少 `source_id` 时默认 `internal`
- ID 冲突统一转为 string 并结合 `source_id` 区分

## 10. Security / Privacy / Compliance
本轮不引入鉴权，仅返回公开书籍信息与最小进度字段；不记录用户敏感数据。

## 11. Observability
- 记录聚合接口耗时与失败来源（internal/ximalaya）
- 记录 `partial` 与 `sources_failed` 计数

## 12. Testing Plan
- 后端：验证 `/home`、`/search`、`/history` 响应结构
- 搜索：内部/外部均有结果时合并排序正确
- 前端：首页/搜索/播放器/历史完整链路

## 13. Rollout & Migration
- 先上线后端聚合接口，保留旧接口
- 再更新前端调用
- 回滚：前端切回旧路径或恢复 mock；后端移除聚合路由不影响旧接口

## 14. Work Breakdown & Timeline
1) 后端聚合接口实现  
   - Files: `backend/tingshu/api/v1/home.go`, `backend/tingshu/api/v1/search.go`, `backend/tingshu/api/v1/history.go`, `backend/tingshu/api/routes.go`
   - DoD: `/home`/`/search`/`/history` 可用且返回结构符合契约

2) 播放进度扩展  
   - Files: `backend/tingshu/api/v1/playback.go`
   - DoD: 支持 `source_id` 写入与读取，默认值生效

3) 前端 API 接入  
   - Files: `mobile-app/src/services/api.ts`, `mobile-app/src/types/index.ts`
   - DoD: 新接口可调用，类型匹配

4) 首页组件改造  
   - Files: `mobile-app/src/screens/HomeScreen.tsx`, `mobile-app/src/components/HeroCarousel.tsx`, `mobile-app/src/components/EditorsPick.tsx`, `mobile-app/src/components/CategoryTabs.tsx`, `mobile-app/src/components/Rankings.tsx`
   - DoD: 移除 mock，渲染真实数据

5) 搜索与历史改造  
   - Files: `mobile-app/src/screens/SearchScreen.tsx`, `mobile-app/src/screens/HistoryScreen.tsx`, `mobile-app/src/hooks/usePlayHistory.ts`
   - DoD: 聚合搜索可用；历史后端优先、本地回退

6) 文档更新  
   - Files: `README.md`
   - DoD: 环境变量与接口说明一致

## 15. Acceptance Criteria
- [ ] `/api/v1/home` 返回 `sections` 并包含 4 个模块
- [ ] `/api/v1/search` 返回单一 `items[]` 且带 `source_id/source_type`
- [ ] `/api/v1/history` 返回最小进度列表并含 `source_id`
- [ ] 前端首页/搜索/播放器/历史均加载真实数据
- [ ] 搜索外部失败时仍有内部结果并无崩溃
- [ ] 历史接口失败时回退本地缓存

## 16. Open Questions
- Target Release 具体时间
