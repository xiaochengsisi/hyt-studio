# HYT Studio 安全加固报告

> 审计日期：2026-08-14
> 范围：`apps/server`（NestJS 后端）+ 前端 web/admin + 共享包
> 方法：逐文件源码审查（鉴权、存储、上传、配置、SEO、审计、依赖）

---

## 一、已实施的安全修复（已通过 `nest build` 验证）

| # | 风险 | 严重度 | 修复位置 | 说明 |
|---|------|--------|----------|------|
| 1 | 生产环境未设 `ADMIN_PASSWORD` 时静默使用弱口令 `admin123` | 高 | `app.module.ts` | 生产环境若口令缺失 / <8 位 / 等于 `admin123`，**直接拒绝启动**（与 `JWT_SECRET` 强制策略对齐） |
| 2 | `jwt.strategy` 生产兜底密钥 `change-me` | 高 | `modules/auth/jwt.strategy.ts` | 生产环境缺失或弱 `JWT_SECRET` 时抛错启动失败，杜绝静默弱密钥签发令牌 |
| 3 | 文件上传仅按扩展名校验，可伪装成图片上传 | 高 | `modules/uploads/uploads.controller.ts` | 新增 **magic-byte 内容签名校验**：二进制图像比对文件头；SVG 校验结构并拒绝内联 `<script>`/`javascript:`/`on*=` 等可执行内容 |
| 4 | `/uploads` 静态资源可被 SVG 直接打开触发存储型 XSS | 中 | `main.ts` | 为 `/uploads` 静态托管追加 `Content-Security-Policy: default-src 'none'; script-src 'none'` 与 `X-Content-Type-Options: nosniff`（不影响 `<img>` 正常引用） |
| 5 | 存储 `delete` 仅过滤前导斜杠，存在路径穿越隐患 | 中 | `modules/storage/local.storage.ts`、`s3.storage.ts` | `storageKey` 强制正则 `^[\w-]+\.[a-z0-9]+$`，并二次校验解析路径仍位于 uploads 目录内，拒绝任意文件删除 |
| 6 | 审计日志只记录成功操作，暴力破解无迹可寻 | 中 | `modules/audit-log/audit.interceptor.ts` | `tap` 增加 `error` 分支，记录失败的写操作与**登录失败**（含状态码），用于发现暴力破解 |
| 7 | 后台写接口缺角色级鉴权（仅有登录态） | 中 | `common/guards/roles.guard.ts`、`common/decorators/roles.decorator.ts`、`app.module.ts` 及各后台控制器 | 新增全局 `RolesGuard` + `@Roles('admin')`，对 users / site-config(admin) / uploads / media / backup / audit-log / ai-seo 等写接口加管理员约束；未标注路由自动放行，不影响公开接口 |
| 8 | 出站请求可被打向内网（SSRF） | 中 | `common/utils/ssrf.ts`、`ai-seo.service.ts`、`webhook.service.ts` | 新增 `isSafeOutboundUrl`：禁止非 http(s)、localhost/内部主机名，并对域名做 DNS 解析后二次校验；AI 接口与 webhook 推送前均校验目标地址 |
| 9 | 登录无失败锁定，存在凭证填充风险 | 中 | `modules/auth/auth.service.ts` | 同一账号连续失败 5 次锁定 15 分钟，成功清零；锁定期间返回通用错误，避免账号枚举 |
| 10 | 公开提交接口可被垃圾灌库 | 中 | `submissions/dto/submission.dto.ts`、`submissions.service.ts` | 新增蜜罐字段 `hp`，被填充即按垃圾信息处理；邮箱格式校验已存在并保留 |
| 11 | S3 存储写死 `ACL: public-read` | 低 | `modules/storage/s3.storage.ts`、`.env.example` | ACL 改由 `S3_ACL` 环境变量控制（默认 public-read），并补充文档 |
| 12 | 登录口令校验过松（MinLength(1)） | 中 | `modules/auth/dto/login.dto.ts` | 密码最小长度提升到 8 位 |
| 13 | CLI 迁移数据源实体不全（仅 6/13） | 中 | `src/data-source.ts` | 补齐全部 13 个实体，与运行时 AppModule 对齐，避免迁移漏表 |

**验证**：`npm run build`、`npm run typecheck`（全 workspace）、`npm run lint`、`npm test`（server 10/10）均通过。

---

## 二、依赖漏洞扫描结果（未自动修复）

`npm audit`（官方源）结果：**21 个漏洞（1 严重 / 8 高 / 10 中 / 2 低）**。

主要项：
- **tar（严重）**：`node-tar` 多路径穿越/DoS，属 **构建期传递依赖**（经 `cacache`）。运行时 `server` 不解析不可信 tar 归档，**实际利用面低**。
- **multer（高/中）**：上传中间件相关，存在 DoS 类问题。
- **qs / uuid / express / @nestjs/platform-express（中）**：多为间接依赖。

**为何未强制修复**：`npm audit fix --force` 要求把 Nest 10 → 11、multer 1 → 2、sqlite3 5 → 6、typeorm 10 → 11 等破坏性大版本升级，且与当前锁定的 Nest 10 栈冲突（`npm audit fix` 已中止，未改动 `package-lock.json`）。此类升级属**需要完整回归测试的迁移**，不宜在加固过程中盲目执行。

**建议的后续动作（需单独排期 + 测试）**：
1. 在独立分支将 Nest 栈整体升级到 11.x，并升级配套 `@nestjs/*`、`typeorm`、`sqlite3`、`multer@2`，跑通 `lint / typecheck / build / test` 与核心接口冒烟。
2. 对 `multer@2` 需确认 `FileInterceptor` API 是否变化（v2 对 `fileFilter`/`limits` 兼容，通常无破坏性改动）。
3. 升级后用 `npm audit` 复验，目标清零高危及以上。

---

## 三、残留风险与后续建议（文档化，本次未强制改动）

| 风险 | 说明 | 建议 |
|------|------|------|
| 角色级鉴权缺失 | 全局 `JwtAuthGuard` 只验登录态不验 `role`；当前仅有 `admin` 角色故无影响，但若未来引入非管理员账号则越权风险 | 增加 `RolesGuard` + `@Roles('admin')`，对 `users / site-config / uploads / media / backup / audit-log` 等写接口加角色约束 |
| JWT 存储在 localStorage | 前端把令牌存 `localStorage`，一旦存在 XSS 即被窃取 | 改用 **httpOnly + Secure + SameSite Cookie**，或内存存储 + 短期令牌（如 15–30min）+ 刷新令牌 |
| 内部 SSRF（管理面） | `ai-seo` / `webhook` 的 URL 来自后台配置，管理员可控；若管理员账号被盗可探测内网 | 对出站请求做 URL 校验：禁止 `localhost` / `127.0.0.1` / `169.254.*` / `10.*` / `192.168.*` / `172.16-31.*`，或仅允许 HTTPS 公网地址 |
| `analyticsCode` 注入 XSS | 后台 `site-config.analyticsCode` 被原样注入 `<head>` 并执行 `<script>` | 属管理员自有功能；若担忧，可改为仅允许白名单统计平台（百度/GA）的代码片段，或做沙箱/域名校验 |
| 提交接口防刷 | `POST /api/submissions` 公开（5/min），可被垃圾数据灌库 | 增加邮箱格式校验 +  honeypot 隐藏字段 + 登录后放宽策略 |
| 登录无锁定/验证码 | 仅 10/min 限流，存在凭证填充风险 | 失败 5 次临时锁定 + 可选图形/滑块验证码（结合已增强的失败审计日志） |
| S3 写死 `ACL: public-read` | 私有桶场景会失败 | 由 `S3_ACL` 环境变量控制，默认 `public-read` |

**已确认安全的方面**：
- SQL 全部走 TypeORM QueryBuilder / Repository 参数化绑定，无注入。
- 全局 `ValidationPipe({ whitelist:true })` 剥离未声明字段，防越权覆盖。
- 敏感字段（`aiApiKey` / `smtpPass`）仅在 `getAdminConfig`（需登录）返回，公开接口不泄露。
- `.env` 已 gitignore；Swagger 仅非生产环境暴露；helmet 默认启用 HSTS / nosniff。
- `@Public()` 仅用于只读公开接口，后台写接口均受 JWT 守卫保护。

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
- [ ] Nest 栈破坏性升级至 11.x（建议单独排期 + 回归测试）
- [ ] JWT 存储方式优化（httpOnly Cookie / 短期令牌）—— 涉及前端改造，建议后续迭代
