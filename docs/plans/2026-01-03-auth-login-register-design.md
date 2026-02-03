# 登录注册（Supabase Auth + userID）设计

日期: 2026-01-03  
状态: Draft

## 背景
当前项目尚未实现登录/注册能力，移动端个人中心仍为 mock 数据，后端也未提供认证接口。与此同时，数据存储已基于 Supabase，但认证链路没有落地，导致用户资料与历史等能力无法绑定账号。本次需要在测试阶段完成最小可用的账号体系：用 Supabase Auth 负责密码存储与登录；新增 profiles 映射表支持 7 位 userID 作为登录标识；移动端新增登录/注册页面且保持现有 UI 风格。

## 目标
- 支持 userID（7 位数字）+ email + 密码注册
- 登录支持 userID 或 email
- 密码强度：长度 ≥8，包含字母 + 数字 + 特殊字符（不强制大小写）
- 使用 Supabase 作为用户数据与认证来源
- UI 与现有风格一致（tokens、按钮、布局风格复用）

## 非目标
- 不做手机号登录与短信/邮箱验证码
- 不接入第三方 OAuth
- 不引入复杂权限/角色体系
- 不对现有业务 API 强制鉴权（保持兼容）

## 方案选择
选择“Supabase Auth + Profiles 映射”方案：
- Supabase Auth 负责 email/password 与会话
- 新增 `profiles` 表保存 `user_id_7` 与 `auth_user_id` 映射
- userID 登录通过后端先查映射，再走 Supabase Auth 登录

## 架构设计
### 数据库（Supabase）
- 新表 `profiles`
  - `id` uuid primary key，关联 `auth.users.id`
  - `user_id` varchar(7) unique not null（仅数字）
  - `email` text unique not null
  - `created_at` timestamptz default now()
- 索引：`user_id`、`email` 唯一索引
- 可选：RLS 保持开启，仅允许服务端使用 service key 读写

### 后端（Gin）
新增 `/api/v1/auth` 路由：
- `POST /auth/register`
  - body: `user_id`, `email`, `password`
  - 校验格式与强度
  - 调用 Supabase Auth `signUp`
  - 插入 `profiles` 映射
  - 若插入失败，回滚删除 auth user（避免孤儿账号）
- `POST /auth/login`
  - body: `identifier`, `password`
  - identifier 为 7 位数字时查 `profiles` 获取 email
  - 调用 Supabase Auth `signInWithPassword`
  - 返回 `access_token`, `refresh_token`, `user`
- 错误返回统一结构：`code`, `message`
- 依赖配置：`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`

### 移动端（Expo）
新增登录/注册页面（独立路由或 modal）：
- 复用 `tokens`、`createButtonStyle` 与现有布局规范
- 表单字段：userID、email、password
- 前端同样做强校验与清晰提示
- 调用后端 `/auth/register` 与 `/auth/login`
- 登录成功后保存会话（复用 `supabase` client 的 `setSession` 或自建存储）
- 个人中心未登录时引导跳转登录页

## 数据流
1) 注册：App -> `/auth/register` -> Supabase Auth signUp -> profiles 插入 -> 返回 session  
2) 登录：App -> `/auth/login` -> 若 userID 则查 profiles -> Supabase Auth signIn -> 返回 session  
3) 退出：App 清理本地 session -> UI 退回未登录状态  

## 错误处理与边界
- userID 非 7 位数字：直接拒绝
- 密码不满足强度：前后端一致提示
- userID 或 email 已存在：返回 `USER_ID_EXISTS` / `EMAIL_EXISTS`
- Supabase Auth 失败：返回 `AUTH_FAILED`
- profiles 插入失败：回滚 auth user，并返回 `PROFILE_CREATE_FAILED`

## 安全与隐私
- 密码仅交给 Supabase Auth 处理，不在后端存储明文
- 后端仅使用 service key 进行 profile 写入与回滚
- 错误消息避免泄露过多账户存在信息（测试阶段可适度宽松）

## 测试与验证
- 接口：注册成功、重复 userID/email、弱密码、userID 登录、email 登录
- 移动端：注册 -> 登录 -> 个人中心展示登录态 -> 退出登录
- 手动检查：`EXPO_OFFLINE` 需关闭以允许联网

## 发布与回滚
- 先创建 `profiles` 表与索引
- 上线后端 `/auth/*` 接口，再接入移动端 UI
- 回滚：下线 `/auth/*` 路由，移动端回退到未登录状态

## 风险
- userID 查询存在用户枚举风险（测试阶段可接受）
- Supabase Auth 服务不可用导致登录失败

## Open Questions
- 是否在后续阶段增加邮箱/短信验证与频控
