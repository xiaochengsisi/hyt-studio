<div align="center">

<img src="apps/admin/public/favicon.svg" width="80" alt="HYT Studio Logo" />

# HYT Studio

**一套开箱即用的工作室官网 + 自研 CMS，Vue 3 + NestJS + SQLite，Docker 一键部署**

**A ready-to-use studio website + self-built CMS — Vue 3 · NestJS · SQLite · Docker**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen)](https://nodejs.org)
[![Build](https://github.com/xiaochengsisi/hyt-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/xiaochengsisi/hyt-studio/actions/workflows/ci.yml)

[🚀 快速开始 / Quick Start](#-快速开始--quick-start) · [✨ 功能一览 / Features](#-功能一览--features) · [🐳 部署 / Deploy](#-部署--deploy) · [🤝 贡献 / Contributing](#-贡献--contributing)

</div>

---

## 这是什么？ / What is this?

**中文：** HYT Studio 是一个完整的工作室官方网站，同时也是一套自研的轻量 CMS。你可以 fork 后改几行配置，就拥有一个支持产品展示、博客、团队成员、项目投稿审核的官网——**所有前台内容均可通过后台可视化发布，无需改代码**。

**English:** HYT Studio is a complete studio website and a lightweight self-built CMS. Fork it, tweak a few config lines, and you have a fully-featured site with product showcases, a blog, team pages, and project submission review — **all front-end content is managed visually through the admin panel, no code changes needed**.

> 本项目本身即作为 HYT Studio 的开源产品在官网上展示。  
> This project itself is showcased as an open-source product on our own site.

---

## ✨ 功能一览 / Features

### 前台官网 / Public Site

| 模块             | 说明                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| 🏠 首页          | 工作室介绍 + 精选产品 + 实时统计                                       |
| 📦 产品列表/详情 | 多维筛选（标签/语言/分类/排序）、截图、Markdown 文档、点赞、健康度徽章 |
| 📝 博客          | 文章列表 + Markdown 详情                                               |
| 👥 团队          | 成员展示页                                                             |
| 📬 项目投稿      | 访客可提交开源项目，后台审核后转正                                     |
| 🌐 国际化        | 中文 / English 双语（vue-i18n）                                        |
| 🔍 SEO           | 动态 meta · OG / Twitter 卡片 · JSON-LD 结构化数据（GEO 友好）         |

### 管理后台 / Admin Panel

- **产品管理** — 增删改查、上架/下架/精选/排序、GitHub 数据同步、多图截图、Markdown 文档、多语言翻译、版本历史回滚
- **博客管理** — Markdown 编辑器、定时发布
- **投稿审核** — 一键批准并转为产品草稿
- **页面内容编辑** — 首页 / 关于等前台文案可视化修改
- **站点设置** — SEO · AI SEO（一键生成 SEO 元信息）· Giscus 评论 · SMTP · Webhook
- **多管理员** — 账号管理、操作审计日志
- **数据备份** — 后台一键下载 SQLite 数据库

### 后端 / Backend

- `GET /api/health` 健康检查
- `GET /api/docs` Swagger 接口文档
- `/rss.xml` RSS 订阅
- `/sitemap.xml` 站点地图
- 存储层可切换：本地文件 / S3

### 🤖 AI SEO（生成式引擎优化）

后台配置任意 OpenAI 兼容服务商（DeepSeek / 智谱 GLM / OpenAI / 自定义），在产品或文章编辑页点击「✨ AI 生成 SEO」，根据正文一键生成 SEO 标题、描述与关键词，前台自动输出对应 meta 与 schema.org 结构化数据。

---

## 🛠 技术栈 / Tech Stack

| 层                 | 技术                                                                               |
| ------------------ | ---------------------------------------------------------------------------------- |
| 前台 `apps/web`    | Vue 3 · Vite · TypeScript · Vue Router · vue-i18n                                  |
| 后台 `apps/admin`  | Vue 3 · Vite · TypeScript                                                          |
| 后端 `apps/server` | NestJS 11 · TypeORM · Passport/JWT · SQLite                                        |
| 共享类型           | `@hyt/shared`（npm workspaces monorepo）                                           |
| 部署               | Docker · docker-compose                                                            |
| 质量               | ESLint · Prettier · Husky · lint-staged · Conventional Commits · GitHub Actions CI |

---

## 📁 目录结构 / Directory Structure

```
hyt/
├── apps/
│   ├── web/        # 官网前台
│   ├── admin/      # 管理后台（独立 SPA）
│   └── server/     # 后端 API（REST + JWT + SQLite）
├── packages/
│   └── shared/     # 前后端共享 TS 类型
├── .github/        # CI · Issue / PR 模板
├── Dockerfile
└── docker-compose.yml
```

---

## 🚀 快速开始 / Quick Start

**前置 / Prerequisites：** Node.js ≥ 18

```bash
# 1. 克隆 / Clone
git clone https://github.com/xiaochengsisi/hyt-studio.git && cd hyt-studio

# 2. 安装依赖 / Install（monorepo，一次安装所有子包）
npm install

# 3. 配置后端环境变量 / Configure env
cp apps/server/.env.example apps/server/.env
# 按需修改 JWT_SECRET 与 ADMIN_PASSWORD

# 4. 一键启动 / Start all
npm run dev
```

| 服务     | 地址                  |
| -------- | --------------------- |
| 后端 API | http://localhost:3000 |
| 前台官网 | http://localhost:5175 |
| 管理后台 | http://localhost:5174 |

首次启动后端会自动创建 SQLite 数据库，并创建默认管理员：

- 用户名：`admin`
- 密码：见 `.env` 中的 `ADMIN_PASSWORD`（默认 `admin123`，**生产环境务必修改**）

---

## 🐳 部署 / Deploy

```bash
# 构建并启动（包含后端 + 构建后的前台/后台静态资源）
docker compose up -d --build
```

SQLite 数据库与上传文件通过 volume 持久化。详见 [DEPLOY.md](./DEPLOY.md)。

---

## 🤝 贡献 / Contributing

欢迎 Issue、PR、文档改进和功能建议！详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

```bash
# 代码检查
npm run lint

# 构建验证
npm run build

# 运行后端单元测试
npm test
```

提交规范遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)。

---

## 📄 许可证 / License

[MIT](./LICENSE) © 2026 HYT Studio
