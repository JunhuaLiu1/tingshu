# Spec 6: 首页封面图片获取与代理策略

- Status: Draft
- Owner: TBD
- Created: 2026-02-02
- Target Release: TBD

## 1. Background
目前移动端首页（Home）展示的轮播图、编辑推荐、排行榜等图片来自 `mobile-app/src/data/mockData.ts` 的硬编码 `picsum.photos` 随机图片 URL。该方案无法保证图片与真实书籍匹配，也不利于后续“真实音源/真实推荐”的体验建设。

后端已具备多音源聚合搜索能力（`POST /api/v1/global/search?q=...`），各音源返回的 `Book.cover_url` 通常已包含真实封面图片地址；同时后端已有带白名单校验的代理能力（`GET /api/v1/proxy/audio?source=...&url=...`），可用于绕过部分站点的防盗链/Referer 限制（如实际发生）。

本 Spec 的目标是：定义“首页封面图片从哪里来、如何稳定加载、如何回退与可回滚”的可实施方案，并逐步淘汰 `picsum.photos` 依赖。

## 2. Goals & Non-Goals
### Goals
- G1：首页图片来源从 `picsum.photos` 切换为“后端返回的真实封面 URL”。
- G2：遇到图片防盗链/加载失败时，有明确的回退与可选代理策略。
- G3：方案最小改动、可灰度、可回滚（允许保留 Mock 数据作为开关/兜底）。
- G4：接口/数据结构清晰，后续可演进为“后端统一下发首页推荐内容”。

### Non-Goals
- 不在本次实现图片裁剪/缩略图/多尺寸（可放 Future Work）。
- 不做图片持久化存储（如下载到本地文件系统或上传 CDN），除非作为可选后续方案。
- 不引入新的第三方图片托管服务（除非后续明确需要）。

## 3. Users / Use Cases
- UC-1：用户打开首页，轮播图/推荐/排行榜展示与书籍真实封面匹配的图片。
- UC-2：某些图片 URL 被防盗链拦截或偶发失败时，仍能展示占位图/或通过代理加载成功，避免大片空白。
- UC-3：开发/运营可在不发版的情况下调整“首页内容来源策略”（优先后端，下发可变）。

## 4. Requirements
### Functional Requirements
- FR-1：移动端首页数据不再依赖 `picsum.photos`；默认从后端获取书籍列表并使用其 `cover_url` 渲染。
- FR-2：移动端图片加载失败时必须有用户可接受的兜底（本地占位图或主题色块），且不阻塞页面其它内容展示。
- FR-3：当发现某音源封面存在防盗链/Referer 限制时，支持通过后端代理加载封面（严格白名单，避免 SSRF / Open Proxy）。
- FR-4：新增/调整接口或字段时需保持向后兼容（旧客户端仍可工作）。

### Non-Functional Requirements
- NFR-1：首页首屏图片加载失败率可观测、可定位（至少能从前端日志/埋点看出来源与失败类型）。
- NFR-2：代理能力必须做严格输入校验与域名白名单，禁止私网/localhost 等目标。
- NFR-3：网络与图片请求超时要有上限，避免拖慢首页交互（建议图片代理与抓取均有超时）。

### Assumptions / Constraints
- 现阶段首页内容“推荐算法”不是重点，允许使用固定关键词检索作为临时推荐策略。
- 后端已维护 `proxyWhitelist` 与 `Referer/User-Agent` 规则，可复用。

## 5. Proposed Solution（推荐方案 + 备选）
### 方案 A：前端直连后端音源封面（MVP，最小后端改动）
**做法**
- 首页数据来源改为调用后端聚合搜索：`POST /api/v1/global/search?q={keyword}`（keyword 为固定推荐词）。
- 对结果按需要裁剪/排序后分别喂给轮播图/编辑推荐/排行榜。
- 图片渲染优先使用 `cover_url` 直连。
- 若图片加载失败，可在前端按 `source_id + cover_url` 生成代理 URL（复用现有 `/api/v1/proxy/audio` 代理能力），并重试一次；仍失败则显示本地占位图。

**优点**
- 改动最小：可不新增后端接口；快速摆脱 `picsum.photos`。

**缺点/风险**
- 首页内容质量依赖“固定关键词”的效果；不同音源返回不稳定，可能重复/不相关。
- 使用 `/proxy/audio` 代理图片语义不清晰（但技术上可行）；未来可能需要更明确的 `/proxy/image`。

### 方案 B：后端下发“首页分区数据”（推荐长期形态）
**做法**
- 后端新增首页接口（示例）：`GET /api/v1/home` 返回结构化分区数据（hero/editors_picks/rankings 等）。
- 后端内部可先用“固定关键词 + 多音源搜索”拼装推荐；后续可替换为榜单/运营配置/入库数据。
- 后端为每本书同时返回：
  - `cover_url`（原始 URL）
  - `cover_proxy_url`（可选，指向 `/api/v1/proxy/*`，仅当该源或该 host 需要时下发，或统一下发供前端选择）
- 前端只负责渲染分区数据与图片回退逻辑，不再硬编码关键词。

**优点**
- 首页内容可在服务端演进与调整，客户端更稳定。
- `cover_proxy_url` 由后端统一生成，避免前端重复拼 URL 与规则分散。

**缺点/风险**
- 需要新增后端接口与一定的服务端编排逻辑。

### 方案 C：图片统一代理 + 可选缓存（不推荐作为第一步）
**做法**
- 为图片代理增加缓存与缓存头（`Cache-Control` / `ETag`），降低重复拉取成本。
- 可选：落地到对象存储/CDN 形成“封面缓存层”。

**优点**
- 提升稳定性与加载速度。

**缺点/风险**
- 复杂度与成本明显增加；需要存储/清理策略与合规评估。

**推荐路径**
1) 先落地方案 A（快速替换 picsum，验证各源封面可用性）；
2) 观察数据稳定性后，演进到方案 B（后端下发首页分区）；
3) 若明确存在防盗链/性能瓶颈，再考虑方案 C。

## 6. Architecture & Data Flow
### A 路径（MVP）
```
Mobile Home
  -> POST /api/v1/global/search?q={keyword}
  -> render sections (hero/editors/rankings)
  -> Image: cover_url (direct)
    -> onError: try /api/v1/proxy/audio?source={source_id}&url={cover_url}
    -> onError: placeholder
```

### B 路径（长期）
```
Mobile Home
  -> GET /api/v1/home
  -> render sections
  -> Image: cover_proxy_url ?? cover_url
    -> onError: placeholder (or fallback chain)
```

## 7. Interfaces / Data Contract
### 7.1 Mobile 侧推荐分区数据结构（建议）
```ts
type HomeSectionKey = "hero" | "editors_picks" | "rankings";

interface HomeSection {
  key: HomeSectionKey;
  title: string;
  items: Book[];
}
```

### 7.2 Book 字段扩展（建议）
在 `mobile-app/src/types/index.ts` 的 `Book` 结构增加：
- `cover_proxy_url?: string`（后端格式）
- `coverProxyUrl?: string`（前端格式，可选）

### 7.3 后端接口（方案 B，建议形态）
- `GET /api/v1/home`
- Response:
```json
{
  "code": 200,
  "data": {
    "sections": [
      {
        "key": "hero",
        "title": "推荐",
        "items": [
          {
            "id": "123",
            "title": "示例",
            "author": "作者",
            "source_id": "kuwo",
            "cover_url": "https://...",
            "cover_proxy_url": "https://{api}/api/v1/proxy/image?source=kuwo&url=..."
          }
        ]
      }
    ]
  }
}
```

> 说明：如暂不新增 `/proxy/image`，可让 `cover_proxy_url` 指向现有 `/proxy/audio`，但建议后续补一个更语义化的路由别名（不破坏兼容）。

## 8. Error Handling & Edge Cases
- 图片 URL 为空：直接展示占位图，不发请求。
- 图片加载失败：
  - 若存在 `cover_proxy_url` 则尝试一次代理；
  - 若不存在则尝试“按规则拼装代理 URL”（方案 A）；
  - 仍失败则占位图，并可在开发环境记录错误（含 `source_id/host`）。
- 代理 URL 被后端拒绝（403/400）：直接降级占位图，并记录“白名单/校验失败”。

## 9. Security / Privacy
- 代理必须严格限制：
  - `source` 必须在 `proxyWhitelist`；
  - `url` 仅允许 http/https、限制长度、禁止 userinfo；
  - host 必须在对应 source 的白名单域名后缀；
  - 禁止 localhost/.local/私网 IP（已存在逻辑可复用）。
- 代理避免成为通用 Open Proxy：禁止任意域名透传。

## 10. Rollout / Migration / Rollback
### Rollout
- 增加开关（建议环境变量）：
  - `EXPO_PUBLIC_HOME_DATA_MODE=mock|backend`（默认 backend，异常时可切回 mock）。
- 首期可仅替换 HERO/EDITORS/RANKINGS 的封面来源；功能稳定后移除对 `picsum.photos` 的依赖。

### Rollback
- 只要开关存在，可快速回退到 `mock` 模式（不发版需视是否可动态配置；否则发版回退）。
- 后端新增接口时保持旧接口不变，回滚仅需撤回首页接口注册，不影响搜索/播放链路。

## 11. Work Breakdown
1) Mobile：首页改为从后端取数据（方案 A）
2) Mobile：图片失败回退链（direct -> proxy -> placeholder）
3) Backend（可选）：新增 `/api/v1/home` 分区接口（方案 B）
4) Backend（可选）：新增 `/api/v1/proxy/image`（或为 `/proxy/audio` 增加别名路由）
5) 手工验证与失败率观察

## 12. Testing Notes
- 手工验证：
  - 首页首屏能展示真实封面（至少 3 个分区各有图）。
  - 切换网络/弱网时，图片失败仍有占位图，不影响滚动与点击。
  - 选定一个存在防盗链的 source/host 时，代理路径可加载成功（如发生）。
- 后端（如新增接口）：增加基础单测/集成测试覆盖 URL 校验与白名单逻辑（至少覆盖 400/403/200）。

## 13. Acceptance Criteria
- [ ] 首页不再依赖 `picsum.photos` 随机图片服务。
- [ ] 首页封面来自后端真实数据（`cover_url`），且渲染稳定。
- [ ] 图片加载失败有明确兜底（代理重试或占位图），不会出现大面积空白。
- [ ] 代理能力不构成 Open Proxy（白名单与私网拦截有效）。
- [ ] 可通过开关回滚到 mock 模式。

## 14. Open Questions
- TBD：首期首页分区（hero/editors/rankings）的“固定关键词”取值与数量（需要产品/运营确认）。
- TBD：是否需要新增专门的 `/api/v1/home` 接口（还是先用前端编排 + 全局搜索过渡）。
- TBD：当前各音源封面是否存在防盗链/Referer 限制（需以真实设备/网络验证后决定是否默认走代理）。

