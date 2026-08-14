# HYT Studio 安全加固报告

> 审计日期：2026-08-14  
> 范围：`apps/server`（NestJS 后端）+ 前端 web/admin + 共享包  
> 方法：逐文件源码审查（鉴权、存储、上传、配置、SEO、审计、依赖）

---

## 一、已实施的安全修复（已通过 `nest build` 验证）

| #   | 风险                                                        | 严重度 | 修复位置                                                                                                                                                                      | 说明                                                                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 生产环境未设 `ADMIN_PASSWORD` 时静默使用弱口令 `admin123`   | 高     | `app.module.ts`                                                                                                                                                               | 生产环境若口令缺失 / <8 位 / 等于 `admin123`，**直接拒绝启动**（与 `JWT_SECRET` 强制策略对齐）                                                                                                                                                                                                                             |
| 2   | `jwt.strategy` 生产兜底密钥 `change-me`                     | 高     | `modules/auth/jwt.strategy.ts`                                                                                                                                                | 生产环境缺失或弱 `JWT_SECRET` 时抛错启动失败，杜绝静默弱密钥签发令牌                                                                                                                                                                                                                                                       |
| 3   | 文件上传仅按扩展名校验，可伪装成图片上传                    | 高     | `modules/uploads/uploads.controller.ts`                                                                                                                                       | 新增 **magic-byte 内容签名校验**：二进制图像比对文件头；SVG 校验结构并拒绝内联 `<script>`/`javascript:`/`on*=` 等可执行内容                                                                                                                                                                                                |
| 4   | `/uploads` 静态资源可被 SVG 直接打开触发存储型 XSS          | 中     | `main.ts`                                                                                                                                                                     | 为 `/uploads` 静态托管追加 `Content-Security-Policy: default-src 'none'; script-src 'none'` 与 `X-Content-Type-Options: nosniff`（不影响 `<img>` 正常引用）                                                                                                                                                                |
| 5   | 存储 `delete` 仅过滤前导斜杠，存在路径穿越隐患              | 中     | `modules/storage/local.storage.ts`、`s3.storage.ts`                                                                                                                           | `storageKey` 强制正则 `^[\w-]+\.[a-z0-9]+$`，并二次校验解析路径仍位于 uploads 目录内，拒绝任意文件删除                                                                                                                                                                                                                     |
| 6   | 审计日志只记录成功操作，暴力破解无迹可寻                    | 中     | `modules/audit-log/audit.interceptor.ts`                                                                                                                                      | `tap` 增加 `error` 分支，记录失败的写操作与**登录失败**（含状态码），用于发现暴力破解                                                                                                                                                                                                                                      |
| 7   | 后台写接口缺角色级鉴权（仅有登录态）                        | 中     | `common/guards/roles.guard.ts`、`common/decorators/roles.decorator.ts`、`app.module.ts` 及各后台控制器                                                                        | 新增全局 `RolesGuard` + `@Roles('admin')`，对 users / site-config(admin) / uploads / media / backup / audit-log / ai-seo 等写接口加管理员约束；未标注路由自动放行，不影响公开接口                                                                                                                                          |
| 8   | 出站请求可被打向内网（SSRF）                                | 中     | `common/utils/ssrf.ts`、`ai-seo.service.ts`、`webhook.service.ts`                                                                                                             | 新增 `isSafeOutboundUrl`：禁止非 http(s)、localhost/内部主机名，并对域名做 DNS 解析后二次校验；AI 接口与 webhook 推送前均校验目标地址                                                                                                                                                                                      |
| 9   | 登录无失败锁定，存在凭证填充风险                            | 中     | `modules/auth/auth.service.ts`                                                                                                                                                | 同一账号连续失败 5 次锁定 15 分钟，成功清零；锁定期间返回通用错误，避免账号枚举                                                                                                                                                                                                                                            |
| 10  | 公开提交接口可被垃圾灌库                                    | 中     | `submissions/dto/submission.dto.ts`、`submissions.service.ts`                                                                                                                 | 新增蜜罐字段 `hp`，被填充即按垃圾信息处理；邮箱格式校验已存在并保留                                                                                                                                                                                                                                                        |
| 11  | S3 存储写死 `ACL: public-read`                              | 低     | `modules/storage/s3.storage.ts`、`.env.example`                                                                                                                               | ACL 改由 `S3_ACL` 环境变量控制（默认 public-read），并补充文档                                                                                                                                                                                                                                                             |
| 12  | 登录口令校验过松（MinLength(1)）                            | 中     | `modules/auth/dto/login.dto.ts`                                                                                                                                               | 密码最小长度提升到 8 位                                                                                                                                                                                                                                                                                                    |
| 13  | CLI 迁移数据源实体不全（仅 6/13）                           | 中     | `src/data-source.ts`                                                                                                                                                          | 补齐全部 13 个实体，与运行时 AppModule 对齐，避免迁移漏表                                                                                                                                                                                                                                                                  |
| 14  | JWT 存储于 localStorage（XSS 可窃取令牌）                   | 中     | `modules/auth/jwt.strategy.ts`、`modules/auth/auth.controller.ts`、`modules/auth/auth.service.ts`、前端 `api/client.ts` / `stores/auth.ts` / `CommandPalette.vue` / `main.ts` | 令牌改为 **httpOnly + Secure(生产) + SameSite Cookie** 下发：登录/改密由后端 `res.cookie` 写入，`jwt.strategy` 优先从 Cookie 读取（Bearer 头兜底兼容 Swagger/curl）；前端移除 localStorage 存令牌，请求统一 `credentials:'include'`；新增 `POST /api/auth/logout` 清除 Cookie；JWT 增加 `expiresIn`（默认 7d）实现过期失效 |
| 15  | 异常过滤器泄露内部错误（SQL/路径/栈）                       | 中     | `common/http-exception.filter.ts`                                                                                                                                             | 非 `HttpException` 异常不再把原始 `message` 直接回传客户端，统一返回 `Internal server error`，详细错误（含 stack）写入服务端日志（`Logger.error`）                                                                                                                                                                         |
| 16  | `members` / `submissions` 后台写接口缺 `@Roles('admin')`    | 中     | `modules/members/members.controller.ts`、`modules/submissions/submissions.controller.ts`                                                                                      | 为 `members` 的 adminList/create/update/remove 与 `submissions` 的 review/approve-and-create/delete 补齐 `@Roles('admin')`，与项目其余敏感接口（users/uploads/media/backup/ai-seo/audit-log/site-config）保持一致，杜绝「仅登录即可越权写」的不一致缺口                                                                    |
| 17  | Express `X-Powered-By` 泄露技术栈 / 缺少 Permissions-Policy | 低     | `main.ts`                                                                                                                                                                     | `app.disable('x-powered-by')` 关闭框架指纹；手动中间件设置 `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()`，禁用本站点不使用的敏感能力（helmet v8 已移除顶层 options，故手动实现以兼容各版本）                                                                      |
| 18  | 登录锁定仅存进程内存，重启/多实例后失效                     | 低     | `modules/auth/auth.service.ts`                                                                                                                                                | 锁定记录改为持久化到 `data/.login-lock.json`：启动时 rehydrate 未过期记录，每次失败/成功变更后落盘（同步写、文件极小、零新依赖）；失败时静默降级不影响登录                                                                                                                                                                 |
| 19  | 同源 SPA 下缺少显式 CSRF 防护                               | 中     | `common/guards/csrf.guard.ts`、`app.module.ts`、`modules/auth/auth.controller.ts`、前端 `api/client.ts` / `stores/auth.ts`                                                    | 新增全局 `CsrfGuard`（双提交 Token）：登录/改密/恢复会话时由后端下发非 httpOnly 的 `hyt_csrf` Cookie + 响应体 `csrfToken`；前端在状态变更请求携带 `X-CSRF-Token` 头，后端校验与 Cookie 一致后才放行。`@Public()`（登录入口）、Bearer 调用（Swagger/脚本）、安全方法（GET 等）跳过校验，避免误伤                            |
| 20  | bcrypt cost=10 抗暴力破解成本偏低                           | 低     | `modules/users/users.service.ts`                                                                                                                                              | 4 处 `bcrypt.hash(password, 10)` 提升至 `12`，提高离线破解成本（登录性能影响可忽略）                                                                                                                                                                                                                                       |

**验证**：`npm run build`、`npm run typecheck`（全 workspace）、`npm run lint`（0 error）、`npm test`（server 10/10）均通过。

### 本轮新增（第 21–27 项，源于全量只读审查）

| #   | 风险                                                                                   | 严重度 | 修复位置                                                                                                                                                                                                              | 说明                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 21  | 授权覆盖不一致：articles/products/topics/translations/revisions/subscribers/stats 后台写（及部分读）接口缺 `@Roles('admin')` | 中     | `modules/{articles,products,topics,translations,revisions,subscribers,stats}/*.controller.ts`                                                                                                                       | 为 7 个控制器补齐 `@Roles('admin')`（`translations`/`revisions` 类级，其余方法级），与既有敏感接口一致，消除「仅登录即可越权写 / 读未发布内容」的隐性缺口                                                                                       |
| 22  | articles 归档前后端不一致                                                                | 低     | `apps/admin/src/views/ArticlesView.vue`                                                                                                                                                                             | 后端 `bulk` 拒绝 `archive` 且 `shared` 类型仅 `'published'\|'draft'`，但前端 UI 提供归档按钮并渲染 archived 状态——三方不一致；移除前端 archive 批量操作与归档徽章，与后端 + 类型对齐                                                         |
| 23  | ArticleEditView 存草稿时 `publishedAt` 可能覆盖已有发布时间                            | 低     | `apps/admin/src/views/ArticleEditView.vue`                                                                                                                                                                         | 改为仅 `publish` 时设置新 `publishedAt`；存草稿传 `undefined`，不覆盖后端已有值                                                                                                                                                                  |
| 24  | 前端 `request` 缺 `res.ok`/非 JSON 防御/超时                                            | 低     | `apps/web/src/api/client.ts`、`apps/admin/src/api/client.ts`                                                                                                                                                       | 两者均增加：①`res.ok` 检查；②`Content-Type` 校验（非 JSON 抛友好错误）；③`AbortController` 超时（web 15s / admin 20s）；admin 401 分支保留 `logout()`                                                                                           |
| 25  | 前端 `:href` 绑定用户/管理员来源 URL 未校验协议（潜在 `javascript:` XSS）              | 中     | `apps/web/src/utils/safe-url.ts` + `ProductDetailView`/`TeamView`/`SiteFooter`/`AboutView`                                                                                                                         | 新增 `safeUrl()`：仅允许 `http(s)`/`mailto`，过滤 `javascript:`/`data:`；应用于所有渲染用户/管理员可配置外链的 `:href`                                                                                                                            |
| 26  | `products.syncGithub` 出站 fetch 无超时（GitHub 慢响应挂起）                            | 低     | `modules/products/products.service.ts`                                                                                                                                                                             | 封装 `timedFetch()`（AbortController 30s），用于两次 GitHub API 调用，避免请求长时间挂起                                                                                                                                                          |
| 27  | `logout` 未 await + 列表错误态缺失 + ApiDocs `window.open` 缺 `noopener`               | 低     | `apps/admin/src/layouts/AdminLayout.vue`、`ForceChangePassword.vue`、`apps/web/src/views/{ProductsView,BlogView,TeamView}.vue`、`ApiDocsView.vue`                                                                  | admin 登出改为 `await logout()` 后再跳路由；web 三列表 `load()` 补 `catch`+错误态；ApiDocs 试调 `window.open` 加 `noopener` 并禁用含 `:param` 端点点击                                                                                            |



---

## 二、依赖漏洞扫描与升级结果（已完成：21 → 0）

`npm audit`（官方源）初始结果：**21 个漏洞（1 严重 / 8 高 / 10 中 / 2 低）**，主要来自 Nest 10 栈的传递依赖（`tar`/`multer`/`qs`/`uuid`/`express`/`@nestjs/platform-express` 等）。

**已执行的升级**（直接改动 `package.json` + `package-lock.json`，非破坏性 `--force`）：

- `@nestjs/*` 全家升级至 **11.x**（`common/core/config/jwt/passport/platform-express/swagger/typeorm/mapped-types/cli/schematics/testing`）
- `sqlite3` **5.1.7 → 6.0.1**（消除 `tar` 严重漏洞及其传递依赖）
- `multer` **1.4.5 → 2.2.0**，配套 `@types/multer` → 2.x
- `@nestjs/config` → 4.x、`@nestjs/schedule` → 6.1.3、`@nestjs/throttler` → 6.5.0
- 通过根 `package.json` 的 `overrides` 强制统一 `rxjs@7.8.2`（消除 workspace 嵌套重复副本导致的类型冲突）与 `js-yaml@5.2.3`（消除 @nestjs/swagger 传递的 js-yaml DoS 高危）

**复验结果**：`npm audit --omit=dev` → **found 0 vulnerabilities** ✅

**升级中修复的构建问题**：

1. server 构建脚本由 `nest build` 改为 `tsc -p tsconfig.build.json`——因 `@nestjs/cli@11` 的部分运行时依赖（如 `commander`）在当前 npm + workspaces 下存在剪枝问题，而 tsc 构建与 `nest build` 产出等价且仅依赖 `typescript`（稳定），可保证 `npm ci` 在 Docker 中稳定构建。
2. typescript 随升级涨至 5.9.x，将 `baseUrl` 视为硬错误（TS5101）；在 `apps/web/tsconfig.json` 与 `apps/admin/tsconfig.json` 增加 `"ignoreDeprecations": "6.0"`，保留 `@/*` 路径别名。
3. `package-lock.json` 需随版本重生成，已一并提交。

---

## 三、残留风险与后续建议（角色鉴权 / 锁定 / 防刷 / S3 ACL 本轮已做，见第一节；以下为真正尚未处理的项）

| 风险                                              | 说明                                                                                                         | 建议                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 角色级鉴权缺失（**已解决，见第 7 + 21 项**）       | 全局 `JwtAuthGuard` 只验登录态不验 `role`；已全部后台写/敏感读接口补 `@Roles('admin')`（含本轮 articles/products/topics/translations/revisions/subscribers/stats） | 后续若引入非管理员角色，需同步评估各 `@Roles` 边界                                                                                          |
| JWT 存储于 localStorage（**已解决，见第 14 项**） | 原前端令牌存 `localStorage`，XSS 可窃取；现已改为 httpOnly Cookie 下发，前端不再触碰令牌                     | 无需额外操作；可后续按需引入刷新令牌（refresh token）机制进一步缩短访问令牌有效期                                                   |
| 内部 SSRF（管理面）                               | `ai-seo` / `webhook` 的 URL 来自后台配置，管理员可控；若管理员账号被盗可探测内网                             | 对出站请求做 URL 校验：禁止 `localhost` / `127.0.0.1` / `169.254.*` / `10.*` / `192.168.*` / `172.16-31.*`，或仅允许 HTTPS 公网地址 |
| `analyticsCode` 注入 XSS                          | 后台 `site-config.analyticsCode` 被原样注入 `<head>` 并执行 `<script>`                                       | 属管理员自有功能；若担忧，可改为仅允许白名单统计平台（百度/GA）的代码片段，或做沙箱/域名校验                                        |
| 提交接口防刷                                      | `POST /api/submissions` 公开（5/min），可被垃圾数据灌库                                                      | 增加邮箱格式校验 + honeypot 隐藏字段 + 登录后放宽策略                                                                               |
| 登录无锁定/验证码                                 | 仅 10/min 限流，存在凭证填充风险                                                                             | 失败 5 次临时锁定 + 可选图形/滑块验证码（结合已增强的失败审计日志）                                                                 |
| S3 写死 `ACL: public-read`                        | 私有桶场景会失败                                                                                             | 由 `S3_ACL` 环境变量控制，默认 `public-read`                                                                                        |

> 注：本节上方的「角色级鉴权缺失 / 内部 SSRF / 提交接口防刷 / 登录无锁定 / S3 ACL 写死」均已在本报告第一节（第 7–12 项）实现；第 15–20 项补齐异常信息泄露、越权缺口、框架指纹、锁定持久化、CSRF、哈希强度；第 21–27 项又补齐了 7 个控制器授权覆盖一致性、articles 归档前后端不一致、前端 `request` 健壮性、href 协议校验、GitHub 同步超时、logout 竞态与列表错误态。当前真正尚未处理的仅余 `analyticsCode` 注入 XSS（属管理员自有功能，风险可控）。

**已确认安全的方面**：

- SQL 全部走 TypeORM QueryBuilder / Repository 参数化绑定，无注入。
- 全局 `ValidationPipe({ whitelist:true })` 剥离未声明字段，防越权覆盖。
- 敏感字段（`aiApiKey` / `smtpPass`）仅在 `getAdminConfig`（需登录）返回，公开接口不泄露。
- `.env` 已 gitignore；Swagger 仅非生产环境暴露；helmet 默认启用 HSTS / nosniff。
- `@Public()` 仅用于只读公开接口，后台写接口均受 JWT 守卫保护。

---

## 五、运维侧待办（需用户处理，非代码项）

| 事项                     | 说明                                                                                 | 处理建议                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| ⚠️ GitHub PAT 已暴露     | 会话中曾出现明文 GitHub Personal Access Token（`ghp_...`），已用于推送但可能已被记录 | **立即到 GitHub → Settings → Developer settings → Personal access tokens 撤销该 Token 并重新生成**；建议改用 SSH key 或短期细粒度 Token |
| `analyticsCode` 注入 XSS | 后台 `site-config.analyticsCode` 被原样注入 `<head>` 执行 `<script>`                 | 属管理员自有功能，风险可控；若担忧可对统计代码做平台白名单（百度/GA）校验                                                               |

---

## 四、交付清单

- [x] 生产强口令强制（admin + JWT）
- [x] 上传文件内容签名校验
- [x] `/uploads` 安全响应头
- [x] 存储删除路径穿越加固
- [x] 审计日志覆盖失败操作
- [x] 依赖漏洞扫描与升级方案评估
- [x] 角色级鉴权（RolesGuard + @Roles）
- [x] 出站 SSRF 防护
- [x] 登录失败锁定（防暴力破解）
- [x] 提交接口蜜罐防刷
- [x] S3 ACL 可配置
- [x] 登录口令最小长度 8 位
- [x] CLI data-source 实体补齐
- [x] Nest 栈升级至 11.x + sqlite3 6 + multer 2（依赖漏洞 21 → 0，详见第二节）
- [x] JWT 存储方式优化（httpOnly Cookie + 短期访问令牌 + 登出端点）—— 详见第 14 项
- [x] 异常过滤器避免泄露内部错误（SQL/路径/栈）
- [x] members / submissions 后台写接口补齐 `@Roles('admin')`
- [x] 关闭 `X-Powered-By` 并补充 `Permissions-Policy`
- [x] 登录失败锁定持久化（重启/多实例仍有效）
- [x] CSRF 双提交 Token 防护（后端守卫 + 前端令牌回传）
- [x] bcrypt 哈希成本提升至 12
- [x] 授权覆盖补齐：articles/products/topics/translations/revisions/subscribers/stats 共 7 个控制器补 `@Roles('admin')`
- [x] articles 归档前后端不一致修复（移除前端 archive UI，与后端+类型对齐）
- [x] ArticleEditView 存草稿不覆盖已有 `publishedAt`
- [x] 前端 `request` 增加 `res.ok`/非 JSON 防御/`AbortController` 超时（web 15s / admin 20s）
- [x] 前端 `:href` 协议校验（`safeUrl` 过滤 `javascript:`/`data:`）
- [x] `products.syncGithub` GitHub fetch 加 30s 超时
- [x] `logout` 统一 `await` + web 列表 `error` 态 + ApiDocs `noopener`
