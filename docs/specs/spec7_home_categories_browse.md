# Spec 7: 首页分类可点击与分类浏览页（后端分类 + 双数据源兜底）

- Status: Draft
- Owner: TBD
- Created: 2026-02-03
- Target Release: TBD

## 1. Background
移动端首页「分类」区域当前仅展示 3 个分类标签，点击只会切换高亮（本地 state），不会产生任何导航与内容展示，用户体验为“空架子”。（入口：`mobile-app/src/components/CategoryTabs.tsx`）

仓库当前已具备：
- 后端分类列表接口：`GET /api/v1/categories`（来自 DB `categories` 表）
- 后端本地书库列表接口：`GET /api/v1/books?page&limit`（来自 DB `books` 表，含 `category_id`）
- 多音源聚合搜索能力：`POST /api/v1/global/search?q=...`（用于从音源侧获取“真实可播放内容”）

本 Spec 的目标是在不做大重构的前提下，让首页分类“可点击、有内容”，并提供可回滚与降级策略。

## 2. Goals / Non-goals

### Goals
- G1：首页分类标签改为从后端拉取并可点击，点击进入独立分类浏览页。
- G2：分类浏览页默认展示“后端本地书库”中的分类书籍；当无数据或失败时，自动降级为“多音源搜索结果”（以分类名作为关键词）。
- G3：对用户可感知地“真的有内容”，并且可观测（日志/提示）、可回滚（开关/降级链路）。
- G4：接口风格与现有 APIResponse 结构保持一致；移动端复用现有播放器/搜索链路，避免重复造轮子。

### Non-goals
- NG1：不实现复杂的分类筛选（标签、排序、价格/VIP、筛选器等），仅提供基础分页。
- NG2：不引入新的推荐算法或运营配置系统。
- NG3：不做分类图标/图片资产体系（缺省用通用 icon 即可）。

## 3. User Stories / Use Cases
- UC-1：用户在首页点击任一分类（例如“经典文学”），进入分类页并看到该分类的书籍列表。
- UC-2：后端本地书库没有该分类的书籍时，仍能在分类页看到来自多音源的搜索结果（可播放）。
- UC-3：分类页列表点击书籍后进入播放器：
  - 本地书库书籍：走本地书库播放（`/api/v1/books/:id` + `/api/v1/books/:id/episodes`）。
  - 音源搜索书籍：走音源播放（`/api/v1/sources/:id/books/:bookId` + `/api/v1/sources/:id/audio/*episodeId`）。

## 4. Requirements

### 4.1 Functional Requirements (FR)
- FR-1：首页分类标签数据来自 `GET /api/v1/categories`，并展示前 N 个（默认 N=10，可配置）。
- FR-2：点击分类标签进入“分类浏览页”，URL/路由中必须包含 `categoryId`，并可显示分类名称（来自参数或接口回填）。
- FR-3：分类浏览页优先从后端本地书库加载数据（分页）：
  - `GET /api/v1/categories/:id/books?page={page}&limit={limit}`
- FR-4：当 FR-3 返回空数据（`total=0` 或 `data=[]`）或请求失败时，降级为多音源聚合搜索：
  - `POST /api/v1/global/search?q={categoryName}`
  - 结果以书籍列表形式展示，至少展示前 M 条（默认 M=20，必要时支持“加载更多”按现有搜索逻辑扩展，或先不做分页）。
- FR-5：分类页点击书籍进入播放器的路由参数必须正确：
  - 若书籍包含 `source_id`（或 `sourceId`）且 `id` 为音源侧书籍 id：跳转 `/player?bookId={id}&sourceId={sourceId}`
  - 若书籍不包含 `source_id`（本地书库）：跳转 `/player?bookId={numericId}`（不带 `sourceId`）
- FR-6：当首页分类接口失败时：
  - 需展示可理解的降级：继续显示本地 mock 分类（当前 `mobile-app/src/data/mockData.ts`），并允许点击进入分类页（此时分类页依然走 FR-3/FR-4）。

### 4.2 Non-Functional Requirements (NFR)
- NFR-1：接口超时与错误必须有明确用户提示（Toast 或页面 EmptyState），并且不阻塞其它首页模块渲染。
- NFR-2：分类页首屏性能：首次进入分类页应有 loading 状态且可下拉刷新。
- NFR-3：可回滚：提供一个可配置开关允许回退到“首页分类使用 mock + 不跳转分类页（或跳搜索页）”的旧行为（详见 Rollback）。

## 5. Proposed Solution

### 5.1 推荐方案（匹配当前选择：B/C/B）
**核心思路**
- 首页分类：从后端 `GET /categories` 拉取并展示前 N 个；点击进入独立分类浏览页。
- 分类页数据：优先本地书库（DB 分类书籍）；失败/为空时降级到多音源搜索（分类名作为关键词）。

**为什么推荐**
- 分类“入口”来自后端 DB，稳定可控，便于后续扩展（更多分类、排序、运营配置）。
- 内容层面通过“双数据源兜底”保证“总能出来东西”，并覆盖“本地书库”和“真实音源可播放内容”两类场景。

### 5.2 备选方案
- 方案 A（最快）：点击分类直接跳 `/search`，自动填入分类名并立即搜索；优点是改动最小，缺点是没有“分类页”承载更完整体验。
- 方案 B（纯后端）：分类页只展示本地书库数据；优点是确定性强，缺点是数据空时体验差。
- 方案 C（纯音源搜索）：分类页只做 `global/search`；优点是“更真实”，缺点是结果不稳定且与 DB 分类体系脱节。

## 6. Architecture & Data Flow

### 6.1 首页分类
```
HomeScreen
  -> CategoryTabs
    -> GET /api/v1/categories
    -> render top N
    -> onPress(category) -> router.push("/category/{categoryId}?name={categoryName}")
```

### 6.2 分类浏览页
```
CategoryScreen(categoryId, categoryName)
  -> GET /api/v1/categories/:id/books?page&limit
  -> if empty or error:
       POST /api/v1/global/search?q={categoryName}
  -> render list
  -> onPress(book):
       if book.source_id: /player?bookId&sourceId
       else: /player?bookId
```

## 7. Interfaces / Data Model

### 7.1 现有接口（复用）
- `GET /api/v1/categories`
- `POST /api/v1/global/search?q={keyword}`
- `GET /api/v1/books?page&limit`
- `GET /api/v1/books/:id`
- `GET /api/v1/books/:id/episodes`

### 7.2 新增接口（后端）
#### `GET /api/v1/categories/:id/books`
Query:
- `page`（默认 1）
- `limit`（默认 20）

Response（延续现有分页结构风格，嵌入到 APIResponse.data 内）：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "category": { "id": 1, "name": "经典文学", "description": "..." },
    "data": [
      { "id": 123, "title": "...", "author": "...", "cover_url": "...", "category_id": 1, "play_count": 0 }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

错误码建议：
- 404：分类不存在
- 500：DB 查询失败

### 7.3 移动端类型与兼容
移动端现有 `Category` 类型未包含 `icon_url` 字段，但后端会返回 `icon_url`；本次不强依赖该字段，保持兼容即可（必要时后续补齐类型字段）。

## 8. Error Handling & Edge Cases
- 分类列表加载失败：首页分类降级为 mock 分类；页面其它模块正常渲染；可在 error banner 或 toast 提示一次。
- 分类页本地书库接口失败：展示错误提示，同时自动 fallback 到 `global/search`（若 categoryName 缺失则只提示错误并给重试）。
- 分类页本地书库返回空：不展示“空列表”，直接 fallback 到 `global/search`，并在 UI 上以弱提示标注“本地无数据，已为你搜索音源内容”。
- 路由参数缺失：
  - 缺少 `categoryId`：直接返回上一页并提示错误。
  - 缺少 `categoryName`：本地书库可正常加载；fallback 搜索不可用（提示“无法获取分类名称”并给重试/返回）。
- 书籍点击进入播放器：
  - 本地书籍 id 非数字：提示“书籍参数错误”（不进入播放器）。
  - 音源书籍缺少 `source_id`：尝试作为本地书籍处理（若 id 为数字），否则提示错误。

## 9. Rollout / Migration / Rollback

### 9.1 Rollout（建议）
- 默认启用“后端分类 + 分类页”。
- 新增移动端开关（环境变量/常量）：
  - `EXPO_PUBLIC_HOME_CATEGORIES_LIMIT`：首页分类展示数量，默认 `10`。
  - `EXPO_PUBLIC_HOME_CATEGORIES_MODE`：`backend`（默认）/`mock`（强制使用 mock）。

> 注：Expo 环境变量通常需要重新构建 App 才能生效；若要“线上不发版调参”，应后续引入后端下发配置（Future Work）。

### 9.2 Rollback（必须可执行）
- 将 `EXPO_PUBLIC_HOME_CATEGORIES_MODE=mock`：首页分类回退为 mock 数据（但仍可保持“点击进入分类页”）。
- 如需完全回退到旧体验（点击只高亮不跳转），在前端保留 `enableCategoryNavigation` 常量（默认 true），紧急回滚时置为 false 并发版。

## 10. Work Breakdown (Implementation Plan)
1. Mobile：改造 `CategoryTabs` 支持后端拉取分类 + 点击导航到分类页（含失败降级 mock）。
2. Mobile：新增分类页路由与页面（Expo Router），实现本地书库加载 + fallback 全局搜索 + 点击进入播放器。
3. Backend：新增 `GET /api/v1/categories/:id/books`，支持分页并返回 category 信息。
4. Testing：后端补单测（成功/404/空分类/分页边界）；移动端做手测清单。

Done Definition：
- 点击首页任一分类能进入分类页并看到书籍列表（本地或 fallback）。
- 至少 1 本书可进入播放器并正常开始播放（本地库或音源）。
- 后端接口返回结构符合约定，错误码符合预期。

## 11. Testing Notes
### Backend
- `go test ./...`（新增 `categories_books_test.go`，覆盖：成功、分类不存在、分页参数、空列表）

### Mobile（手动）
- 首页分类列表可滚动、可点击进入分类页。
- 分类页首次进入有 loading；下拉刷新可重试。
- 本地分类有数据时：列表展示 + 点击能进入播放器（不带 `sourceId`）。
- 本地分类无数据时：提示 fallback 并展示音源搜索结果；点击可进入播放器（带 `sourceId`）。

## 12. Acceptance Criteria
- [ ] 首页分类来自后端 `GET /api/v1/categories`，展示前 N 个且可点击。
- [ ] 点击分类进入独立分类页，显示分类名称与书籍列表。
- [ ] 分类页优先本地书库数据；当本地为空或失败时自动 fallback 到 `global/search` 并展示结果。
- [ ] 分类页任意书籍点击后可进入播放器并开始播放（本地库或音源至少一种链路可用）。
- [ ] 后端新增接口 `GET /api/v1/categories/:id/books` 已实现并具备基本测试覆盖。

## 13. Open Questions
1. 首页分类默认展示数量 N 是否固定为 10？是否需要产品化“更多分类”入口？（当前先不做，后续可加）
2. 分类页是否需要“加载更多/分页”覆盖 fallback（global/search）结果？（当前可先只展示前 20 条）
3. UI 文案：fallback 时提示语与展示样式是否有明确产品要求？（当前按轻提示处理）

## 14. Future Work
- 后端下发首页/分类页配置（分类展示顺序、推荐策略、开关）以实现不发版调参。
- 分类页排序（热度/最新/完结）、筛选与更丰富的分类层级。
- 为分类/书籍提供更稳定的封面代理策略（结合 Spec 6）。

