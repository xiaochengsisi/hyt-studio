# HYT Studio 官网 monorepo 代码库完整分析报告

> 分析路径：`D:\11\hyt`（只读源码级分析，未修改任何文件）
> 结构：NestJS（后端）+ 两个 Vue3 独立应用（前台/后台）+ 共享 TS 类型包，npm workspaces 管理。

---

## 一、整体架构与技术栈

### 1.1 工作区布局（根 `package.json`）
- `workspaces: ["apps/*", "packages/*"]`，使用 npm workspaces。
- 根脚本：`dev`（全部启动）、`dev:web/dev:admin/dev:server`、`build`、`typecheck`、`lint`（eslint）、`test`（仅 server 的 jest）、`format`。

### 1.2 三个应用 + 一个共享包

| 应用 | 技术栈 | 入口/端口 | 关键依赖 |
|---|---|---|---|
| `apps/web` 前台官网 | Vue3 + Vite5 + vue-router4 + vue-i18n9 + vue-tsc | `src/main.ts`，dev `5173` | marked、dompurify（Markdown 渲染+清洗） |
| `apps/admin` 后台 | Vue3 + Vite5 + vue-router4 + vue-tsc | `src/main.ts`，dev `5174` | marked、dompurify |
| `apps/server` 后端 API | NestJS10 + TypeORM + SQLite + JWT + passport | `src/main.ts`（监听 `PORT`，默认 3000） | `@nestjs/typeorm` `sqlite3` `bcryptjs` `helmet` `multer` `nodemailer` `@nestjs/throttler` `@nestjs/schedule` `@nestjs/swagger` `@resvg/resvg-js`（OG 图）`class-validator/transformer` |
| `packages/shared` | 纯 TS 类型契约 | `src/index.ts`（被 web/admin/server 以 `@hyt/shared` 引用） | 无运行时依赖 |

### 1.3 单端口一体化部署模式（关键架构决策）
后端 `main.ts` 在同进程内同时：
- 提供 REST API（`/api/...`）
- 托管上传文件（`/uploads/`，由 `app.useStaticAssets` 静态提供）
- 生产环境托管构建后的前台 SPA（`public/`，根路径 `''`）与后台 SPA（`admin-public/`，`/admin`）
- 用自写的 history 模式 fallback（`serveSpa`）把非 `/api`、非 `/uploads`、无扩展名的 GET 请求回退到对应 `index.html`

> 这意味着 Docker 部署时一个容器即"API + 前台 + 后台"三合一，避免了跨域配置（同源部署）。

### 1.4 全局中间件/管道/拦截器/过滤器（`main.ts` + `app.module.ts`）
- **helmet**：安全响应头（`contentSecurityPolicy:false` 注释说明原因；`crossOriginResourcePolicy: cross-origin` 以便前端跨域加载 `/uploads`）。
- **gzip**：自写中间件，仅压缩文本类响应（跳过图片/视频/二进制）。
- **CORS**：白名单来自 `CORS_ORIGINS`（默认本地 5173/5174/5175），支持 `credentials`。
- **`ValidationPipe`**：`whitelist:true` + `transform:true` + `enableImplicitConversion`（剥离 DTO 未声明字段，防越权覆盖）。
- **`TransformInterceptor`（全局）**：统一响应信封 `{ code:0, message:'ok', data }`。
- **`HttpExceptionFilter`（全局）**：统一异常格式 `{ code, message, data:null, path, timestamp }`。
- **`ThrottlerGuard`（全局）**：默认 60 次/分钟；各敏感接口用 `@Throttle` 收紧（登录 10/min、提交 5/min、订阅 5/min、点赞 30/min）。
- **`JwtAuthGuard`（全局）** + **`AuditInterceptor`（全局）**。

---

## 二、后端 server 详解

### 2.1 模块装配 `app.module.ts`
- `onModuleInit` 中调用 `UsersService.ensureAdmin(ADMIN_USERNAME||'admin', ADMIN_PASSWORD||'admin123')` 播种默认管理员（首次启动、库无用户时）。
- TypeORM：`type:'sqlite'`，`database: DB_PATH||data/hyt.db`，`synchronize: NODE_ENV!=='production'`（开发自动建表，生产关闭改用迁移），`migrationsRun: production`。
- 全局 provider：`APP_GUARD` → ThrottlerGuard、`APP_GUARD` → JwtAuthGuard、`APP_INTERCEPTOR` → AuditInterceptor。

### 2.2 认证与鉴权机制（`auth/`、`common/`）
- **`JwtStrategy`**（`auth/jwt.strategy.ts`）：`passport-jwt`，从 `Authorization: Bearer` 取 token；`secretOrKey = JWT_SECRET || 'change-me'`；`validate` 返回 `{id, username, role, mcp}`。
- **`JwtAuthGuard`**（`common/guards`）：继承 `AuthGuard('jwt')`，读 `Public()` 元数据放行公开接口；若 token 中 `mcp=true`（强制改密中），仅允许标注 `@AllowPasswordChange()` 的接口，否则抛 `ForbiddenException`。
- **装饰器**：`Public()`、`CurrentUser()`（注入 `JwtUser`）、`AllowPasswordChange()`。
- **登录流程**：`AuthController.login` → `AuthService.login` → 查用户 + `bcrypt.compare` → `jwtService.sign`，返回 `{token, user, mustChangePassword}`。
- **强制改密**：`auth/change-password`（`@AllowPasswordChange`）校验旧密码后签发 `mcp:false` 新 token。种子用户 `mustChangePassword=true`，首次登录必须改密。
- **`users` 模块**：`UsersService` 提供 `create`（用户名≥3、密码≥6、唯一校验）、`updatePassword`、`changePassword`、`remove`（禁止删自己、至少保留 1 个管理员）。

### 2.3 数据库实体与关系（14 张表 + 1 张关联表）
| 实体 | 文件 | 关键字段 / 关系 |
|---|---|---|
| `User` | users/user.entity | id, username(unique), password(bcrypt), role, **mustChangePassword**, 时间戳 |
| `Product` | products/product.entity | slug(unique), name, status(published/draft/archived), featured, sortOrder, viewCount, likeCount, GitHub 同步字段(stars/forks/issues/license/updatedAt/syncedAt), SEO 字段, **scheduledAt**(定时发布), `DeleteDateColumn`(软删除) |
| `ProductLike` | products/product-like.entity | productId→Product(ManyToOne CASCADE), anonId；**唯一索引 (productId, anonId)** 实现匿名点赞去重 |
| `Article` | articles/article.entity | slug(unique), title, status(published/draft), publishedAt, scheduledAt, SEO 字段, 软删除 |
| `SiteConfig` | site-config/site-config.entity | 单行配置（站点名/SEO/AI 配置/SMTP/Webhook/Giscus 等），`content` 存页面文案 JSON |
| `Submission` | submissions/submission.entity | name, tagline, description, repoUrl, homepage, author, email, status(pending/approved/rejected), reviewNote |
| `AuditLog` | audit-log/audit-log.entity | action, method, path, target, targetId, userId, username, ip, detail, status |
| `Member` | members/member.entity | name, role, bio, 社交链接, sortOrder, 软删除 |
| `Revision` | revisions/revision.entity | entityType, entityId, snapshot(JSON), username（内容快照/回滚） |
| `Media` | media/media.entity | url, filename, mimetype, size, storageKey（媒体库记录） |
| `Topic` | topics/topic.entity | slug, name, **ManyToMany→Product**（关联表 `topic_products`），软删除 |
| `Subscriber` | subscribers/subscriber.entity | email(unique), confirmed, confirmToken（Newsletter 双确认） |
| `Translation` | translations/translation.entity | entityType, entityId, locale, fields(JSON)；**唯一索引 (entityType,entityId,locale)**（多语言） |

> 迁移：`src/migrations/` 有 8 个迁移文件（InitSchema + AddMustChangePassword + AddEngagementAndGithub + AddMembers + AddP1Schema + AddWebhookAndTopicsView + AddTranslationsAndHealth），生产环境 `migrationsRun` 自动执行。`data-source.ts` 供 CLI 生成/运行迁移（注意：CLI 的 entities 列表比运行时少，仅历史前 6 个——潜在小坑）。

### 2.4 各业务 Module 核心逻辑

#### 产品 `products/`（最复杂）
- `list(query)`：QueryBuilder 动态拼条件（status/featured/keyword/tag/language/category）+ 多种排序（default/hot/views/likes/stars/newest）；公开列表（`status=published`）加 20s TTL 缓存；`hot` = `viewCount + likeCount*5 + githubStars`。
- `findBySlug`：公开详情；浏览量计数用内存 `Map` 按 `ip:productId` 10 分钟去重；支持多语言覆盖（读 `translations`）。
- `toggleLike`：按 `anonId` 去重，原子 `increment` 增/减 `likeCount`。
- `create/update`：每次保存后调 `revisions.saveSnapshot` 留档，并 `webhook.emit` 事件；草稿→发布触发 `published` 事件。
- `syncGithub(id)`：解析 `repoUrl` → 调 GitHub API 同步 stars/forks/issues/license/language/最新 release 版本；可选 `GITHUB_TOKEN` 提升限额。
- `computeHealth(slug)` → `HealthService`：纯本地基于 GitHub 数据计算健康度徽章。
- `bulk`：批量 publish/draft/archive/delete（软删）。

#### 文章 `articles/`
与产品对称：`list`、`findBySlug`（多语言）、`create/update`（留档+webhook）、`bulk`（不支持 archive）、软删。

#### 提交审核 `submissions/`（前台→后台核心链路）
- `create`：公开，校验 `name≥2` 且至少填 repoUrl 或 homepage，`webhook.emit('submission.created')`。
- `review(id, status, note)`：approve/reject。
- `approveAndCreate(id)`：把提交字段带入新建产品草稿（`status:'draft'`），slug 冲突时自动追加 `-2/-3…`（最多 20 次）。
- 限流 5/min。

#### 站点配置 `site-config/`
单行记录。`getConfig()`（公开，不返回 `aiApiKey`/`smtpPass` 等敏感字段）vs `getAdminConfig()`（含密钥，需登录）。

#### AI SEO `ai-seo/`
- `POST /api/ai-seo/generate`（需登录）→ `AiSeoService.generate(payload, userId)`。
- 限流：内存按用户 20 次/分钟。
- 读 `site-config` 的 `aiBaseUrl/aiApiKey/aiModel`（OpenAI 兼容）。
- `fetch` 超时 30s（`AbortController`），要求返回严格 JSON（`seoTitle/seoDescription/seoKeywords`），`parseResult` 健壮解析。

#### OG 图 `og/`（`@resvg/resvg-js`）
`GET /api/og/product/:slug.png`（公开）：拼 SVG（产品名/标语/语言/star/版本），resvg 渲染 1200×630 PNG。SVG 文本做了 `escape` 防注入。

#### 上传 `uploads/` + 存储 `storage/` + 媒体 `media/`
- `UploadsController.upload`（`POST /api/uploads`，需登录）：`multer` 内存存储，`fileFilter` 仅允许图片扩展名，`limits.fileSize=5MB`；调 `StoragePort.save` 落盘/上传后 `MediaService.record` 入库。
- 存储抽象：`StoragePort` 接口 + `LocalStorage`（默认）/ `S3Storage`（`STORAGE_DRIVER=s3`）。`delete` 对 `filename` 做了 `replace(/^[/\\]+/,'')` 防路径穿越。

#### 修订历史 `revisions/`
产品/文章每次 `create/update` 后 `saveSnapshot`；`rollback(id)` 把快照 JSON 写回实体。

#### 审计日志 `audit-log/`
**`AuditInterceptor`（全局）**：对所有 `POST/PUT/DELETE/PATCH` 及登录写 `audit_log`，`sanitize` 把 `password/secret/token/apikey/key` 字段替换为 `***`，正文超 200 字截断；仅记录成功。

#### 统计 `stats/`
`getDashboardStats`（后台仪表盘）、`getPublicStats`（前台数字带，60s 缓存）、`getActivity`（首页活动流，30s 缓存）。

#### Webhook `webhook/`
单例服务，关键事件向 `site_config.webhookUrls` 异步 POST，5s 超时，`Promise.allSettled` 单条失败不阻断。

#### 定时任务 `scheduler/`
`@Cron(EVERY_MINUTE) publishScheduled`：扫描 `status='draft' && scheduledAt<=now` 的产品/文章，自动转 `published`。

#### 多语言 `translations/`
按 `(entityType,entityId,locale)` 存 JSON 字段；前台详情按 `?lang=` 或 `Accept-Language` 合并翻译覆盖。

#### 成员 `members/` / 专题 `topics/` / 订阅 `subscribers/`
- `MembersService`：前台 `GET /members` 公开（按 sortOrder），后台增删改软删。
- `TopicsService`：专题 `ManyToMany` 产品，`findBySlug` 仅返回已发布产品；`topic_products` 关联表。
- `SubscribersService`：订阅发确认邮件（未配 SMTP 降级打印），点链接确认；`broadcast` 群发。

#### 备份 `backup/` / SEO `seo/` / 健康检查 `health/` / 邮件 `mail/` / 用户 `users/`
- `BackupController`：`GET /backup/export` 导出全站 JSON；`POST /backup/import` 合并模式。
- `SeoController`（无 `/api` 前缀）：`GET /rss.xml`、`GET /sitemap.xml`，均转义输出。
- `HealthController`：`GET /api/health`，查 `SELECT 1`。
- `MailerService`：动态 `require('nodemailer')`，SMTP 来自站点配置。
- `UsersController`：`GET /users`、`POST /users`、`PUT /:id/password`、`DELETE /:id`。

### 2.5 种子数据
`AppModule.onModuleInit` → `UsersService.ensureAdmin('admin','admin123')`：仅当库无该用户名时创建，`role:'admin'`、`mustChangePassword:true`（首次登录强制改密）。

---

## 三、前端 web（前台官网）详解

### 3.1 入口与路由
- `main.ts`：挂载 `i18n`、`router`；`router.afterEach` 按路由名设默认标题；自定义 `v-reveal` 指令（IntersectionObserver 滚动渐入）。
- `router/index.ts`：history 模式，路由：`/`、`/products`、`/products/:slug`、`/blog`、`/blog/:slug`、`/topics`、`/topics/:slug`、`/api-docs`、`/about`、`/team`、`/submit`、`*`(404)。
- **API 层** `api/client.ts`：封装 `fetch('/api'+url)`，解包 `{code,message,data}` 信封。

### 3.2 状态/SEO/组件
- **无 Pinia/Vuex**：用组合式函数 + 工具模块。`App.vue` 在 `onMounted` 拉 `site-config`，`watch(site)` 调 `applySiteSeo`，并把 `analyticsCode`（第三方统计）原样注入 `<head>` 并执行其中的 `<script>`。
- **SEO** `composables/useSeo.ts`：动态写 title/description/OG/Twitter；`setJsonLd` 注入 `application/ld+json` 结构化数据（GEO）；详情页注入 `SoftwareApplication` 的 JSON-LD，OG 图指向 `/api/og/product/:slug.png`。
- **公共组件**：`SiteHeader/SiteFooter`、`ProductCard`、`Comments`（Giscus）、`ShareBar`、`InstallCopy`、`Pagination`、`Skeleton`、`BackToTop`。
- **Markdown 渲染** `MarkdownRenderer.vue`：`marked.parse` + `DOMPurify.sanitize`，并为 h2/h3 注入锚点 id。
- **i18n** `i18n/index.ts`：zh-CN / en-US，localStorage 存偏好。
- **匿名标识** `utils/anon-id.ts`：localStorage 生成 UUID 用于点赞去重。

### 3.3 关键页面
- `HomeView`：并行拉取站点配置/产品列表/热门/最新文章/公开统计/活动流，按 `resolveContent(site.content)` 渲染可后台配置的文案（`content.ts` 提供 `DEFAULT_CONTENT` 兜底）。
- `SubmitView`：提交表单 → `api.submitProject`。
- `ProductDetailView`：加载详情、相关项目、健康度徽章、JSON-LD、点赞、Giscus 评论。

---

## 四、前端 admin（后台）详解

### 4.1 路由与鉴权
- `router/index.ts`：`/login` 公开；其余挂 `AdminLayout`（`dashboard/products/articles/topics/submissions/media/subscribers/backup/audit-log/content/members/users/settings` 及编辑页）。`beforeEach`：未登录跳 `/login`。
- **状态** `stores/auth.ts`：reactive `auth{ token, user, mustChangePassword }`，持久化到 `localStorage`。

### 4.2 API 层
- `api/client.ts`：每次请求带 `Authorization: Bearer <token>`；401 自动 `logout()`；`upload` 用 `FormData`。

### 4.3 布局与核心管理页
- `layouts/AdminLayout.vue`：左侧栏菜单（13 项）+ `CommandPalette`(⌘K) + `ForceChangePassword` 遮罩 + 退出登录。
- **产品编辑** `ProductEditView.vue`：表单含名称/Slug（自动 slugify）/Logo/Screenshots(多图排序)/GitHub URL/标签/语言/分类/简介/`MarkdownEditor`/SEO 区/**「✨ AI 生成 SEO」**/**「↻ 从 GitHub 同步」**/状态/精选/排序/定时发布；挂载 `RevisionsPanel` 与 `TranslationsPanel`。
- **富文本/Markdown**：`MarkdownEditor.vue`（`marked`+`DOMPurify`）。
- 其他页：仪表盘、文章、提交审核、媒体库、订阅、备份、审计日志、页面内容、团队、用户、站点设置。

---

## 五、packages/shared 详解（`src/index.ts`）

单文件导出全部跨端契约：实体接口（`SiteConfig`/`Product`/`Article`/`User` 等）、API 包装（`ApiResponse<T>`/`Paginated<T>`/`LoginPayload`/`LoginResult`）、业务载荷（`SubmitProjectPayload`/`AiSeoGeneratePayload`/`BulkActionPayload` 等）。DTO（class-validator 类）定义在各 module 的 `dto/` 内，shared 只放纯接口/枚举，避免前端引入校验运行时。

---

## 六、关键业务流程

### 6.1 访客提交项目 → 后台审核 → 前台展示
1. `SubmitView` → `POST /api/submissions`（公开，限流 5/min）。
2. `SubmissionsService.create` 校验后入库，`webhook.emit('submission.created')`。
3. 后台 `approveAndCreateSubmission` → `POST /api/submissions/admin/:id/approve-and-create`。
4. `approveAndCreate` 调 `ProductsService.create` 生成草稿产品（slug 自动去重），提交状态置 `approved`。
5. 管理员完善信息、点发布（或 `scheduledAt` 定时发布）。
6. 前台公开接口读取 `status='published'` 展示。

### 6.2 AI SEO 生成
后台点按钮 → `POST /api/ai-seo/generate`（限流20/min/用户）→ 读站点 AI 配置 → fetch OpenAI 兼容接口（30s 超时）→ 健壮解析严格 JSON → 回填表单 → 前台输出 meta+JSON-LD。

### 6.3 浏览量/点赞
- 详情页 `GET /products/slug/:slug`：按 `ip:productId` 10 分钟内存去重 `increment viewCount`。
- 点赞 `POST /products/slug/:slug/like`：前端传 `anonId`，后端 `ProductLike` 唯一索引去重，原子增减 `likeCount`。

### 6.4 定时发布
产品/文章保存为 `draft` 且填 `scheduledAt` → `SchedulerService` 每分钟扫描到点自动转 `published`。

---

## 七、代码质量与值得注意的点

### 7.1 正面
- 无 TODO/FIXME/硬编码密钥泄漏。
- SQL 安全：所有查询走 TypeORM QueryBuilder/Repository 参数化绑定。
- 输入校验：全局 ValidationPipe(whitelist)，各 DTO 用 class-validator。上传限定图片扩展名 + 5MB。
- 敏感字段隔离：`aiApiKey`/`smtpPass` 仅 `getAdminConfig`（需登录）返回；审计日志 `sanitize` 屏蔽密码/密钥。
- 安全加固：生产环境缺 `JWT_SECRET` 或 <16 位直接启动失败；默认管理员强制首次改密。
- 生产部署稳健：`synchronize` 仅开发，生产用迁移；DB 与 uploads 走 volume 持久化；`enableShutdownHooks` 优雅关闭。

### 7.2 潜在隐患 / 待改进
- **`.env` 默认值弱口令**：`ADMIN_PASSWORD||'admin123'`、`JWT_SECRET||'change-me'`。生产靠 env 强制，但启动告警不够醒目。
- **`login.dto.ts` 密码仅 `MinLength(1)`**：登录输入校验过松。
- **`local.storage.delete` 仅过滤了前导 `/`**：实际 filename 由服务端随机生成，风险低。
- **`S3Storage` 写死 `ACL:'public-read'`**：私有桶需调整。
- **迁移脚本 entities 不一致**：`data-source.ts`（CLI 用）的 entities 仅含前 6 个，运行时含全部 14 个；用 CLI `migration:generate` 可能漏表。
- **`AuditInterceptor` 仅记录成功操作**：失败/未授权尝试不入库。
- **测试覆盖很低**：仅 2 个 spec（`ai-seo.service.spec.ts` 4 用例、`login.dto.spec.ts`），核心 service 无单测。

### 7.3 测试覆盖
- 仅 `ai-seo.service.spec.ts`（4 用例：未配置抛错/纯 JSON/代码块/非 2xx）、`auth/dto/login.dto.spec.ts`。
- `jest.config.js`：`ts-jest` 预设。整体覆盖率很低。
- CI（`.github/workflows/ci.yml`）：Node 24，跑 lint→typecheck→build→test。

---

## 八、构建 / 运行 / 部署方式

### 8.1 根脚本
- `npm run dev` 同时起 web(5173)/admin(5174)/server(3000)；前端 dev 用 Vite proxy 把 `/api`、`/uploads` 转发到 `localhost:3000`。
- `npm run build`：web/admin `vue-tsc -b && vite build`；server `nest build`。
- `npm run typecheck` / `npm run lint` / `npm test`（server jest）。

### 8.2 配置要点（`.env.example` / `DEPLOY.md`）
关键变量：`PORT`(3000)、`JWT_SECRET`(生产必填≥16)、`CORS_ORIGINS`、`ADMIN_USERNAME/PASSWORD`、`PUBLIC_BASE_URL`、`STORAGE_DRIVER`(local/s3)+`S3_*`、`AI_PROVIDER/BASE_URL/API_KEY/MODEL`、`GITHUB_TOKEN`、`DB_PATH`。
数据库：SQLite 单文件 `data/hyt.db`，备份即复制文件；uploads 在 `uploads/`。

### 8.3 Docker（一体化镜像）
- `Dockerfile`：两阶段（node:20-slim 构建 → runtime）。`npm ci --legacy-peer-deps`；构建产物 `dist`→`public`(web)→`admin-public`(admin)。`HEALTHCHECK` 探 `/api/health`。容器固定 3000。
- `docker-compose.yml`：`build: .`，端口 `3000`，env_file `.env`，volume 持久化 `./data` 与 `./uploads`，restart unless-stopped。
- `DEPLOY.md` 详述：Compose 部署 / 单命令 `docker run` / Nginx 反代(HTTPS) / 源码部署 / 数据备份恢复 / 变量速查 / FAQ。
- 访问：前台 `/`、后台 `/admin`、Swagger `/api/docs`(仅开发)、健康 `/api/health`。
