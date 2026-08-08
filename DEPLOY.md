# 部署指南

HYT Studio 为一体化部署：**单个容器**同时提供后端 API（NestJS）、前台官网 SPA 与后台管理 SPA。

- 前台官网：`http://<host>:3000/`
- 后台管理：`http://<host>:3000/admin`（默认账号 `admin` / `admin123`，**首次登录后请立即修改**）
- API 文档（Swagger）：`http://<host>:3000/api/docs`
- 健康检查：`http://<host>:3000/api/health`

---

## 一、Docker Compose 部署（推荐）

### 1. 准备环境变量

```bash
cp .env.example .env
```

编辑 `.env`，**至少修改以下项**：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `JWT_SECRET` | JWT 签名密钥，务必改为随机串 | `openssl rand -hex 32` |
| `CORS_ORIGINS` | 允许跨域的来源（你的域名） | `https://hyt.example.com` |
| `ADMIN_PASSWORD` | 初始管理员密码 | `your-strong-password` |
| `PUBLIC_BASE_URL` | 站点对外地址 | `https://hyt.example.com` |

### 2. 构建并启动

```bash
docker compose up -d --build
```

### 3. 查看日志 / 状态

```bash
docker compose logs -f hyt
docker compose ps
```

### 4. 升级

```bash
git pull
docker compose up -d --build
```

> 数据库与上传文件通过 volume 持久化在宿主机 `./data` 与 `./uploads`，容器重建不会丢失。

---

## 二、Docker 单命令部署

```bash
docker build -t hyt-studio .

docker run -d \
  --name hyt-studio \
  -p 3000:3000 \
  -v "$PWD/data:/app/data" \
  -v "$PWD/uploads:/app/uploads" \
  -e JWT_SECRET="$(openssl rand -hex 32)" \
  -e ADMIN_PASSWORD=admin123 \
  -e CORS_ORIGINS=https://hyt.example.com \
  -e PUBLIC_BASE_URL=https://hyt.example.com \
  --restart unless-stopped \
  hyt-studio
```

---

## 三、反向代理（Nginx + HTTPS）

建议在容器前放一层 Nginx 处理 TLS 与域名，示例：

```nginx
server {
    listen 443 ssl http2;
    server_name hyt.example.com;

    ssl_certificate     /etc/letsencrypt/live/hyt.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hyt.example.com/privkey.pem;

    client_max_body_size 20m; # 上传截图体积

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

使用此配置时，将 `.env` 中 `PUBLIC_BASE_URL` 与 `CORS_ORIGINS` 设为 `https://hyt.example.com`。

---

## 四、不使用 Docker（源码部署）

适合开发或无 Docker 环境。

### 前置要求
- Node.js ≥ 18（推荐 20）
- npm

### 步骤

```bash
# 1. 安装依赖（monorepo workspaces）
npm ci --legacy-peer-deps

# 2. 配置环境变量
cp apps/server/.env.example apps/server/.env
# 编辑 apps/server/.env，设置 JWT_SECRET 等

# 3. 构建全部包
npm run build

# 4. 启动生产服务
cd apps/server
NODE_ENV=production node dist/main.js
```

> 生产模式下后端会**自动运行数据库迁移**（`migrationsRun`），无需手动建表。
> 若需手动管理迁移：
> ```bash
> cd apps/server
> npm run migration:show     # 查看待执行迁移
> npm run migration:run      # 执行迁移
> npm run migration:revert   # 回滚上一次迁移
> npm run migration:generate src/migrations/YourChange   # 由实体变更生成新迁移
> ```

---

## 五、数据备份与恢复

数据库为单文件 SQLite，备份只需复制文件：

```bash
# 备份
cp ./data/hyt.db ./data/hyt-backup-$(date +%F).db

# 恢复
docker compose stop hyt
cp ./data/hyt-backup-2026-01-01.db ./data/hyt.db
docker compose start hyt
```

上传资源位于 `./uploads/`，建议一并备份。

---

## 六、环境变量速查

| 变量 | 必填 | 默认值 | 说明 |
| --- | :---: | --- | --- |
| `JWT_SECRET` | ✅ | — | JWT 签名密钥，生产缺失或过短将启动失败 |
| `NODE_ENV` | — | `production` | 设为 `production` 启用迁移、关闭 synchronize |
| `PORT` | — | `3000` | 服务监听端口 |
| `CORS_ORIGINS` | — | 本地开发端口 | 允许跨域来源，逗号分隔 |
| `DB_PATH` | — | `/app/data/hyt.db` | SQLite 文件路径 |
| `ADMIN_USERNAME` | — | `admin` | 初始管理员用户名 |
| `ADMIN_PASSWORD` | — | `admin123` | 初始管理员密码 |
| `PUBLIC_BASE_URL` | — | `http://localhost:3000` | 站点对外地址 |
| `STORAGE_DRIVER` | — | `local` | 文件存储驱动：`local` / `s3` |
| `S3_*` | — | — | 启用 S3 时配置 |
| `AI_PROVIDER` | — | — | AI SEO 供应商：`deepseek` / `zhipu` / `openai` / 自定义 |
| `AI_API_KEY` | — | — | AI 接口密钥 |

---

## 七、常见问题

**Q：容器启动后访问 `/admin` 或前台页面 404？**
A：确认构建产物已正确拷入。`docker compose logs hyt` 查看是否出现 `HYT Studio server running on http://localhost:3000`。

**Q：启动报 `JWT_SECRET` 相关错误？**
A：生产模式下密钥缺失或少于 16 位会主动失败。请在 `.env` 中设置 `JWT_SECRET` 后重启。

**Q：首次部署后数据库表未创建？**
A：生产模式通过迁移建表。若 `DB_PATH` 指向的目录不可写会导致迁移失败，请确保 `./data` volume 可写。
