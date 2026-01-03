# Spec 4: Supabase Auth 登录注册与 userID 映射

- Status: Draft
- Owner: TBD
- Created: 2026-01-03
- Related Design: `docs/plans/2026-01-03-auth-login-register-design.md`
- Target Release: TBD

## 1. Background
当前项目缺少真实的登录/注册能力，移动端个人中心与用户数据为 mock，后端也未提供认证接口。项目已接入 Supabase 数据库，但未建立认证与账号体系，无法绑定用户历史、收藏等数据。本次目标是在测试阶段交付“最小可用”的登录注册功能，支持 userID（7 位数字）与邮箱登录，密码强度符合基本安全要求，并保持与现有 UI 风格一致。

## 2. Goals & Non-Goals
### Goals
- 支持 userID（7 位数字）+ email + password 注册。
- 登录支持 userID 或 email。
- 密码强度校验：长度 >= 8，包含字母 + 数字 + 特殊字符。
- 使用 Supabase Auth 处理密码与会话，不自建密码存储。
- UI 与现有页面保持一致（tokens、按钮、布局风格复用）。

### Non-Goals
- 不做手机号登录、不做短信/邮箱验证码。
- 不接入第三方 OAuth。
- 不对现有业务 API 强制鉴权。
- 不引入复杂角色/权限体系。

## 3. Users / Use Cases
- 新用户：输入 userID + email + password 注册并登录。
- 既有用户：使用 userID 或 email + password 登录。
- 退出登录：清理本地会话并回到未登录状态。

## 4. Requirements
### Functional Requirements
- FR-1：后端提供 `POST /api/v1/auth/register`，校验 userID/email/password，成功后创建 Supabase Auth 账号并写入 profiles 映射表。
- FR-2：后端提供 `POST /api/v1/auth/login`，支持 userID 或 email 登录，返回 access_token/refresh_token/user。
- FR-3：创建 `profiles` 表，保存 `user_id`(7 位数字)、`email` 与 `auth_user_id` 映射，且 userID/email 唯一。
- FR-4：移动端新增登录/注册页面，表单校验与错误提示清晰。
- FR-5：登录成功后在客户端持久化 session，并在个人中心展示基础登录态（至少显示 userID 或 email）。

### Non-Functional Requirements
- NFR-1：后端不记录密码明文或敏感日志。
- NFR-2：所有鉴权相关请求使用 HTTPS（依赖部署环境）。
- NFR-3：错误信息避免过度暴露账号存在性（测试阶段可放宽）。

### Assumptions / Constraints
- Supabase 项目已创建并可用；后端具备 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_KEY`。
- 测试阶段不启用邮箱/短信验证。
- 移动端可联网（需要关闭 `EXPO_OFFLINE=1`）。

## 5. Proposed Solution
使用 Supabase Auth 承担注册与登录，并新增 `profiles` 表映射 userID。后端提供统一的 `/auth/register` 与 `/auth/login` 接口，以支持 userID 或 email 登录。移动端仅调用后端接口，不直接暴露 service role key；登录成功后，将 session 写入 `supabase` client（或自有存储）以持久化登录态。

### Components
- Backend API: `backend/tingshu/api/v1/auth.go`（新增）
- Backend Router: `backend/tingshu/api/routes.go`（注册 auth 路由）
- Backend Supabase 客户端/封装：`backend/tingshu/service/supabase_auth.go`（新增或在现有层实现）
- DB Schema: Supabase `profiles` 表与索引
- Mobile Screens: `mobile-app/app/(auth)/login.tsx`, `mobile-app/app/(auth)/register.tsx`（新增）
- Mobile Services: `mobile-app/src/services/api.ts`（新增 auth 调用）
- Mobile Session: `mobile-app/src/services/supabase.ts` 与登录态存储

### Decision Rationale
Supabase Auth 已具备安全的密码处理与会话机制，结合 `profiles` 表可最低成本支持 userID 登录，同时避免自建密码存储与加密细节。

### Alternatives Considered
- 自建用户表 + JWT：实现与安全负担较高，不符合最小改动目标。
- 仅邮箱登录：不满足 userID 登录需求。

## 6. Architecture & Data Flow
```
Mobile Register
  -> POST /api/v1/auth/register
  -> Supabase Auth signUp (email/password)
  -> Insert profiles (user_id, email, auth_user_id)
  -> Return session

Mobile Login
  -> POST /api/v1/auth/login (identifier)
  -> if identifier is userID, lookup profiles -> email
  -> Supabase Auth signInWithPassword
  -> Return session

Mobile Logout
  -> Clear local session
```

## 7. Data Model / Storage
### profiles 表
- id (uuid, PK) = auth.users.id
- user_id (varchar(7), unique, not null)
- email (text, unique, not null)
- created_at (timestamptz, default now())

### RLS
- 保持 RLS 开启，服务端使用 service role key 写入。
- 如需客户端读取 profile，可后续增加 `auth.uid() = id` 的 read policy（TBD）。

## 8. API / Interface Contracts
### POST /api/v1/auth/register
Request:
```json
{
  "user_id": "1234567",
  "email": "user@example.com",
  "password": "Abc123!@#"
}
```
Response:
```json
{
  "code": 200,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com" },
    "session": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```
Errors:
- 400 INVALID_INPUT
- 409 USER_ID_EXISTS / EMAIL_EXISTS
- 500 AUTH_CREATE_FAILED / PROFILE_CREATE_FAILED

### POST /api/v1/auth/login
Request:
```json
{
  "identifier": "1234567",
  "password": "Abc123!@#"
}
```
Response: 同注册
Errors:
- 400 INVALID_INPUT
- 401 AUTH_FAILED
- 404 USER_ID_NOT_FOUND

## 9. Error Handling & Edge Cases
- userID 非 7 位数字：直接拒绝。
- userID 已存在但 Auth 创建失败：返回 AUTH_CREATE_FAILED。
- Auth 创建成功但 profiles 插入失败：回滚删除 auth user。
- userID 不存在时登录返回 USER_ID_NOT_FOUND。
- 密码强度不满足时返回 WEAK_PASSWORD。

## 10. Security / Privacy / Compliance
- service role key 仅存后端配置，禁止下发客户端。
- 不记录敏感请求体到日志。
- 后端对错误进行归一化，避免泄露敏感细节。

## 11. Observability
- 记录 register/login 成功与失败的日志（不包含密码）。
- 统计失败原因类型（INVALID_INPUT / AUTH_FAILED 等）。

## 12. Testing Plan
- 后端手工验证：
  - 注册成功、重复 userID、重复 email、弱密码。
  - userID 登录成功、email 登录成功、userID 不存在。
- 移动端手工验证：
  - 注册 -> 登录 -> 个人中心展示登录态 -> 退出。
- 可选回归：`cd backend && go test ./...`，`cd mobile-app && npm run lint`。

## 13. Rollout & Migration
- 在 Supabase 创建 `profiles` 表与索引。
- 增加后端环境变量说明（`backend/.env.example`）。
- 上线 `/auth/*` 接口后接入移动端 UI。
- 回滚：移除 auth 路由与 UI 入口，保留 Supabase 账号不影响其他功能。

## 14. Work Breakdown & Timeline
1) 数据库与环境配置
   - 目标：创建 profiles 表与索引；补充 `.env.example`。
   - 文件：`backend/.env.example`（新增 Supabase 变量说明）
   - Done：表可写入；本地可加载配置。
2) 后端 Auth 接口
   - 文件：`backend/tingshu/api/v1/auth.go`, `backend/tingshu/api/routes.go`
   - Done：register/login 成功返回 session。
3) 移动端 Auth 页面
   - 文件：`mobile-app/app/(auth)/*`, `mobile-app/src/services/api.ts`
   - Done：注册/登录可用，表单校验生效。
4) 登录态与个人中心
   - 文件：`mobile-app/src/contexts/*` 或 `mobile-app/src/hooks/*`
   - Done：未登录提示、登录后展示 userID/email。
5) 手工回归
   - Done：验收清单全部通过。

## 15. Acceptance Criteria
- [ ] 注册接口拒绝非法 userID 与弱密码。
- [ ] 同一 userID 或 email 不能重复注册。
- [ ] 登录支持 userID 或 email，返回可用 session。
- [ ] 移动端登录/注册 UI 与现有风格一致，错误提示清晰。
- [ ] 登录态可持久化，个人中心可显示登录信息并支持退出。

## 16. Open Questions
- TBD：是否需要提供 profile 读取接口或直接依赖 Auth user 信息。
- TBD：后续是否引入邮箱/短信验证与频控策略。
