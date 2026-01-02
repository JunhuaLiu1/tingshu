# Spec 2: 多源音频代理播放打通

- Status: Draft
- Owner: TBD
- Created: 2026-01-02
- Related Design: `docs/plans/2026-01-02-audio-source-proxy-playback-design.md`
- Target Release: TBD

## 1. Background
当前音频播放链路不稳定：后端返回的章节字段与前端预期不一致，且缺少章节接口；部分音源音频 URL 解析不完整；移动端直连音频容易被拦截或因 HTTP 直链失败。需要统一代理与字段对齐，以保证端到端可播放。

## 2. Goals & Non-Goals
**Goals**
- G1：搜索 → 播放页 → 任意章节可播放（端到端闭环）。
- G2：支持喜马拉雅、酷我、幻听三大音源。
- G3：后端返回 `audio_url` 与 `audio_proxy_url`，前端优先代理播放。
- G4：统一代理接口 + 严格白名单，提升稳定性并防止滥用。

**Non-Goals**
- 不新增音源、不处理登录/付费内容。
- 不引入复杂反爬/代理池。
- 不修改数据库结构或迁移数据。

## 3. Users / Use Cases
- 移动端用户：搜索书籍后进入播放页，点击章节即可播放。
- 运营/开发：通过统一接口快速验证音源可用性。

## 4. Requirements
**Functional Requirements**
- FR-1：`/sources/:id/books/:bookId` 返回书籍详情时包含 `chapters` 列表。
- FR-2：新增 `/sources/:id/chapters/:bookId` 返回章节列表（用于补拉）。
- FR-3：`/sources/:id/audio/:episodeId` 返回 `audio_url` 与 `audio_proxy_url`。
- FR-4：新增 `/proxy/audio` 统一代理接口，严格白名单校验。
- FR-5：前端播放优先使用 `audio_proxy_url`，失败自动回退 `audio_url`。

**Non-Functional Requirements**
- NFR-1：代理支持 `Range` 请求，保证断点播放。
- NFR-2：代理仅允许 http/https 且在白名单域名与路径内。
- NFR-3：接口错误需返回明确错误消息，便于排查。

**Assumptions / Constraints**
- 仅访问公开免费内容，不涉及登录态。
- 网络访问不保证稳定，需有回退策略。

## 5. Proposed Solution
**概述**
在后端补齐章节接口与返回字段，增加统一代理入口，音频获取返回原始与代理 URL。前端播放逻辑切换为“优先代理、失败回退直链”。三大音源仅做最小解析兼容，保证音频 URL 可获取。

**Components**
- Backend API: `/sources`、`/proxy/audio`、音源解析逻辑。
- Mobile App: 播放器逻辑、字段映射。

**Decision Rationale**
- 统一代理简化前端逻辑并提升稳定性。
- 严格白名单降低 SSRF 风险。

**Alternatives Considered**
- 仅前端直连：被拦截风险高，稳定性不足。
- 各音源独立代理接口：维护成本高、扩展复杂。

## 6. Architecture & Data Flow
**高层结构**
```
Mobile App -> /sources/:id/books/:bookId -> (chapters)
Mobile App -> /sources/:id/audio/:episodeId -> (audio_url, audio_proxy_url)
Mobile App -> /proxy/audio?source=...&url=...
```

**关键时序**
1) 搜索结果进入播放页 → 拉取书籍详情与章节。
2) 播放章节 → 请求音频地址 → 获取代理 URL。
3) 播放器优先用代理 URL，失败回退直链。

## 7. Data Model / Storage
- 无数据库变更。
- `audio_proxy_url` 为临时计算字段，仅在 API 响应中返回。

## 8. API / Interface Contracts
### 8.1 获取书籍详情
`GET /api/v1/sources/:id/books/:bookId`

Response（节选）：
```json
{
  "code": 200,
  "data": {
    "id": "123",
    "title": "示例书籍",
    "source_id": "ximalaya",
    "chapters": [
      {
        "id": "987",
        "title": "第1集",
        "index": 1,
        "duration": 320,
        "is_free": true
      }
    ]
  }
}
```
兼容策略：前端优先读 `chapters`，若缺失可回退 `episodes`（旧字段）。

### 8.2 获取章节列表
`GET /api/v1/sources/:id/chapters/:bookId`

Response：
```json
{
  "code": 200,
  "data": [
    {
      "id": "987",
      "title": "第1集",
      "index": 1,
      "duration": 320,
      "is_free": true
    }
  ]
}
```

### 8.3 获取音频地址
`GET /api/v1/sources/:id/audio/:episodeId`

Response：
```json
{
  "code": 200,
  "data": {
    "audio_url": "https://cdn.example.com/audio.mp3",
    "audio_proxy_url": "https://api.example.com/api/v1/proxy/audio?source=ximalaya&url=..."
  }
}
```

### 8.4 统一代理
`GET /api/v1/proxy/audio?source=SOURCE_ID&url=ENCODED_URL`

- source: ximalaya | kuwo | huanting
- url: 必须 URL encode，且域名需在白名单内

成功：返回音频流（200/206）。失败：400/403/502。

## 9. Error Handling & Edge Cases
- 代理失败 → 前端自动回退直链播放。
- 章节列表为空 → 前端提示“暂无可播放章节”。
- 非白名单 URL → 代理返回 403。
- 音频 URL 解析失败 → 返回 502，并记录错误类型。

## 10. Security / Privacy / Compliance
- 严格白名单：仅允许三大音源指定域名与路径。
- 禁止私网 IP、file:// 等非 http/https。
- 日志避免记录完整音频 URL。

## 11. Observability
- 关键日志：source_id、book_id、episode_id、错误类型。
- 指标：音频地址获取成功率、代理成功率、平均响应耗时。

## 12. Testing Plan
- 接口验证：
  - `/sources/:id/books/:bookId` 返回 chapters。
  - `/sources/:id/audio/:episodeId` 返回双 URL。
  - `/proxy/audio` 白名单拦截与 Range 支持。
- 端到端：三平台各选一本书，首集可播放。

## 13. Rollout & Migration
- 无数据迁移。
- 如代理稳定性不足，可在前端切换为直链优先（回退策略）。

## 14. Work Breakdown & Timeline
1) **后端 API 对齐**
   - 目标：补齐章节接口与详情返回。
   - 文件：`backend/tingshu/api/v1/sources.go`，`backend/tingshu/api/routes.go`
   - Done：/books 返回 chapters，新增 /chapters 接口。
2) **统一代理实现**
   - 目标：实现 `/proxy/audio` 严格白名单与流式转发。
   - 文件：`backend/tingshu/api/v1/proxy.go`
   - Done：白名单校验、Range 支持、错误返回清晰。
3) **音源解析兼容**
   - 目标：喜马拉雅/酷我/幻听音频 URL 稳定返回。
   - 文件：`backend/tingshu/source/ximalaya.go`，`backend/tingshu/source/kuwo.go`，`backend/tingshu/source/huanting.go`
   - Done：音频 URL 获取失败率显著下降。
4) **前端播放策略**
   - 目标：优先代理播放，失败回退直链；字段映射 `chapters`。
   - 文件：`mobile-app/src/hooks/useAudioPlayer.ts`，`mobile-app/src/screens/PlayerScreen.tsx`，`mobile-app/src/types/index.ts`
   - Done：播放页可稳定播放三平台内容。

## 15. Acceptance Criteria
- [ ] 喜马拉雅/酷我/幻听三平台均可播放任意一本书的首集。
- [ ] `/sources/:id/audio/:episodeId` 返回 `audio_url` 与 `audio_proxy_url`。
- [ ] `/proxy/audio` 对非法 URL 拒绝，对合法 URL 支持 Range。
- [ ] 前端播放优先代理，失败可自动回退直链。

## 16. Open Questions
- 无。
