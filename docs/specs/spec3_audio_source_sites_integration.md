# Spec 3: 新增听书网站音源接入与移动端搜索分组

- Status: Draft
- Owner: TBD
- Created: 2026-01-03
- Related Design: `docs/plans/2026-01-03-audio-source-sites-integration-design.md`
- Target Release: TBD

## 1. Background
现有后端已支持喜马拉雅/酷我/幻听音源，但可用站点不足且移动端搜索默认只覆盖单一平台。新需求要求将 5 个可爬取站点以 Source 适配器形式接入，并在移动端提供全局搜索、分组展示与单源分页，保持最小改动与可维护性。

## 2. Goals & Non-Goals
### Goals
- 接入 5 个站点：书音FM、七八听书网、听书迷、乐听吧、猫耳FM，均支持搜索/详情/章节/播放。
- 全局搜索默认启用，按音源分组展示结果，每组展示前 5 条。
- 支持单音源搜索分页，并提供快捷切换入口。
- 站点失败时自动降级/禁用，不影响其它源使用。

### Non-goals
- 离线爬虫入库、定时抓取。
- 登录/付费内容与反爬绕过。
- 通用爬虫框架重构或新增大依赖。

## 3. Users / Use Cases
- 普通用户：输入关键词 → 查看多个音源分组结果 → 点击详情并播放。
- 进阶用户：在搜索页切换单音源 → 分页查看更多 → 播放特定章节。

## 4. Requirements
### Functional Requirements
- FR-1：后端新增 5 个 Source 实现，完整实现 `Search`、`GetBookDetail`、`GetChapters`、`GetAudioURL`、`HealthCheck`。
- FR-2：Source Manager 注册新源，`/api/v1/sources` 与 `/api/v1/sources/status` 可展示新源状态。
- FR-3：`/api/v1/global/search?q=...` 聚合所有启用源的第一页结果，返回 `source_id` 可用于前端分组。
- FR-4：移动端默认调用全局搜索，按音源分组展示，每组最多 5 条。
- FR-5：移动端支持切换单音源搜索并分页加载。
- FR-6：播放链路通过 `/api/v1/sources/:id/audio/:episodeId` 获取 `audio_url` 与可选 `audio_proxy_url`。
- FR-7：按需在音频代理白名单与 Referer/UA 中配置新源，必要时启用 `/api/v1/proxy/audio` 中转播放。
- FR-8：失败源记录失败率并触发自动禁用，前端通过 `sources` 状态提示不可用。

### Non-Functional Requirements
- NFR-1：单源请求超时保持在现有 10-15s 以内，避免阻塞全局搜索。
- NFR-2：遵守公开访问边界，仅抓取免登录内容，控制请求频率。
- NFR-3：不存储任何账号凭据或隐私数据。

### Assumptions / Constraints
- 站点 HTML/公开接口可解析出音频与章节。
- 不新增数据库结构与持久化爬虫数据。
- 网络访问权限可用（若受限需另行授权）。

## 5. Proposed Solution
使用逐站点适配器方案：在 `backend/tingshu/source/` 为每个站点新增独立实现，解析 HTML 或公开 API，并在 Source Manager 注册。移动端搜索页引入全局搜索与分组展示逻辑，提供下拉切换单源并分页。音频代理仅在验证需要防盗链时纳入白名单，保持中转成本可控。

### Components
- Backend Source: `backend/tingshu/source/{shuyinfm,ting78,tingsm,leting8,missevan}.go`
- Source 注册：`backend/tingshu/api/v1/sources.go`
- 代理配置：`backend/tingshu/api/v1/proxy.go` 与路由注册
- Mobile 搜索页：`mobile-app/src/screens/SearchScreen.tsx`
- Mobile API：`mobile-app/src/services/api.ts`

### Decision Rationale
逐站点适配器与现有架构一致，改动最小且易于按站点独立维护；全局搜索只取第一页，兼顾响应速度与体验。

### Alternatives Considered
- 通用抓取框架：前期复杂度高，不符合最小改动目标。
- 全量代理中转：带宽成本高、故障面大，不推荐。

## 6. Architecture & Data Flow
```
Mobile Search
  -> /api/v1/global/search?q=kw
  -> Source Manager (parallel Search)
  -> Aggregated Books (source_id)
  -> Mobile grouped list (top 5 per source)

Mobile Single Source
  -> /api/v1/sources/:id/search?page=n
  -> /api/v1/sources/:id/books/:bookId
  -> /api/v1/sources/:id/audio/:episodeId
  -> audio_url / audio_proxy_url (optional)
  -> optional /api/v1/proxy/audio
```

## 7. Data Model / Storage
- 不新增数据库或持久化数据。
- 复用现有结构：`Book`、`Chapter`、`SearchResult`、`HealthStatus`。
- 章节 `ID` 使用站点可唯一标识的 URL/ID 字符串（需稳定且可直接用于获取播放页）。

## 8. API / Interface Contracts
### Global Search
- `POST /api/v1/global/search?q={keyword}`
- Response:
```json
{
  "code": 200,
  "data": {
    "total": 20,
    "results": [
      {
        "id": "123",
        "title": "示例",
        "source_id": "shuyinfm"
      }
    ]
  }
}
```

### Source Search
- `GET /api/v1/sources/:id/search?q={keyword}&page={n}`
- Response: `SearchResult`（含 `books`、`total_page`、`current_page`）。

### Book Detail / Chapters / Audio
- `GET /api/v1/sources/:id/books/:bookId`
- `GET /api/v1/sources/:id/chapters/:bookId`
- `GET /api/v1/sources/:id/audio/:episodeId`

### Source List
- `GET /api/v1/sources`
- `GET /api/v1/sources/status`

### Errors
- 400：参数缺失或不合法（如空关键词/ID）。
- 404：Source 不存在或被禁用。
- 502：抓取失败或解析异常。

## 9. Error Handling & Edge Cases
- 搜索结果为空时返回空列表，不抛异常。
- 章节或音频解析失败返回 502，并记录失败率。
- 全局搜索中单源失败不影响其他源聚合。
- 如果站点被限制访问，自动禁用并在 `sources/status` 反映。

## 10. Security / Privacy / Compliance
- 仅公开免登录内容，遵守 robots.txt 与请求频率控制。
- 代理白名单限制域名与协议，避免 SSRF。
- 不记录完整音频 URL 到日志（如需记录仅保留 host）。

## 11. Observability
- 复用 `Monitor` 记录成功/失败率并触发禁用。
- 在 Source 实现中补充关键错误日志（站点、URL、原因）。

## 12. Testing Plan
- 后端：对每个新源做搜索/详情/章节/播放的手工验证。
- 前端：全局搜索分组展示、下拉切换单源、分页加载与播放链路。
- 回归：现有三大音源搜索与播放不受影响。

## 13. Rollout & Migration
- 无数据迁移。
- 如出现单源失败可通过 `/sources/:id/disable` 临时禁用。
- 回滚：移除新源注册或回退提交。

## 14. Work Breakdown & Timeline
1) 后端新增 5 个 Source 实现  
   - 目标：Search/Detail/Chapters/Audio 可用  
   - 文件：`backend/tingshu/source/*.go`  
   - Done：每源可通过接口获取音频 URL  
2) 注册与代理配置  
   - 文件：`backend/tingshu/api/v1/sources.go`, `backend/tingshu/api/v1/proxy.go`, `backend/tingshu/api/routes.go`  
   - Done：sources 列表包含新源；需要代理的源可通过代理播放  
3) 移动端全局搜索与分组 UI  
   - 文件：`mobile-app/src/screens/SearchScreen.tsx`, `mobile-app/src/services/api.ts`  
   - Done：默认全局搜索、分组展示、每组 5 条、可切单源分页  
4) 手工验证与回归  
   - Done：核心路径通过，失败源可降级

## 15. Acceptance Criteria
- [ ] `/api/v1/sources` 显示 5 个新增音源，且状态可查询。
- [ ] `/api/v1/global/search` 返回包含 `source_id` 的聚合结果。
- [ ] 移动端全局搜索分组展示，每组最多 5 条，并可“查看更多”。
- [ ] 移动端可切换单音源并分页搜索。
- [ ] 任意新源在播放页可获取音频 URL 并播放（必要时通过代理）。
- [ ] 单源失败不影响其他源，状态可被禁用/启用。

## 16. Open Questions
- TBD：每个站点是否需要代理白名单与 Referer/UA，需上线前验证确认。
