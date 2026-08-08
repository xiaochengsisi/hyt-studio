# HYT Studio 官网

HYT Studio 网络工作室官方开源网站。基于 Vue 3 + NestJS + SQLite 的自研内容管理系统，官网前台与独立后台一体，可展示开源产品与团队动态，前台所有展示内容（除底部版权）均可通过后台可视化发布。

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前台 web | Vue 3 + Vite + TypeScript + Vue Router |
| 后台 admin | Vue 3 + Vite + TypeScript（独立应用） |
| 后端 server | NestJS + TypeORM + JWT + SQLite |
| 共享 | @hyt/shared 类型包 |

## 目录结构

```
hyt/
├── apps/
│   ├── web/        # 官网前台（产品展示 / 博客 / 关于 / 提交申请）
│   ├── admin/      # 管理后台（登录 / 产品 / 文章 / 用户 / 审核 / 设置）
│   └── server/     # 后端 API（REST + JWT + SQLite）
├── packages/
│   └── shared/     # 前后端共享类型
├── .github/        # Issue / PR 模板与 CI
├── Dockerfile      # 生产部署
└── docker-compose.yml
```

## 快速开始

前置：Node.js >= 18

```bash
# 1. 安装依赖（根目录，npm workspaces 会一并安装所有子包）
npm install

# 2. 配置后端环境变量
cp apps/server/.env.example apps/server/.env

# 3. 一键启动（或分别运行下面三个）
npm run dev            # 同时启动后端 / 前台 / 后台
```

也可以分别启动：

```bash
npm run dev:server     # 后端 http://localhost:3000
npm run dev:web        # 前台 http://localhost:5175
npm run dev:admin      # 后台 http://localhost:5174
```

首次启动后端会自动创建 SQLite 数据库，并创建默认管理员（见 `.env`）：

- 用户名：`admin`
- 密码：见 `ADMIN_PASSWORD`（默认 `admin123`，生产环境务必修改）

> 生产环境务必修改 `JWT_SECRET` 与 `ADMIN_PASSWORD`，并按部署章节配置。

## 功能

**前台**
- 首页：工作室介绍 + 精选产品
- 产品列表 / 详情：名称、简介、Logo、截图、标签、GitHub、版本、文档
- 博客列表 / 详情、关于我们
- 项目提交申请：访客可提交开源项目，后台审核后转正
- SEO：动态 meta、OG / Twitter 卡片、JSON-LD 结构化数据（生成式引擎优化 GEO）

**后台**
- 登录（JWT）、多管理员账号管理
- 产品管理：增删改查、上架/下架、精选、排序、多图截图上传、Markdown 文档
- 博客管理：写文章、发布、Markdown 编辑
- 项目提交审核：批准 / 驳回 / 删除
- 页面内容编辑：前台文案（除底部版权）可视化修改
- 站点设置：站点信息、备案与统计、SEO、AI SEO（一键生成 SEO 元信息）
- 操作审计日志

**后端 API（/api）**
- 认证、用户、产品、文章、提交审核、站点配置、上传
- `GET /api/health` 健康检查
- `GET /api/docs` Swagger 接口文档
- RSS（`/rss.xml`）与 sitemap（`/sitemap.xml`）

## AI SEO（生成式引擎优化）

后台「站点设置」中配置任意 OpenAI 兼容服务商（DeepSeek / 智谱 GLM / OpenAI / 自定义），填入接口地址、模型与 API Key 后，在产品或文章编辑页点击「✨ AI 生成 SEO」即可根据正文一键生成 SEO 标题、描述与关键词。前台详情页会自动输出对应 meta 与 schema.org 结构化数据，便于传统搜索引擎与 ChatGPT / Perplexity 等 AI 引擎收录引用。

## 部署

提供 Docker 一键部署：

```bash
# 构建并启动（包含后端 + 构建后的前台/后台静态资源）
docker compose up -d --build
```

默认对外端口见 `docker-compose.yml`，SQLite 数据库与上传文件通过 volume 持久化。详见 [部署文档](./docs/DEPLOY.md)。

## 开发与质量

```bash
npm run lint           # ESLint 检查
npm run lint:fix      # 自动修复
npm run build          # 构建所有 workspace
npm test               # 运行后端单元测试
```

- 提交前 husky + lint-staged 会自动校验与格式化
- 提交规范遵循 Conventional Commits（详见 [CONTRIBUTING](./CONTRIBUTING.md)）

## 说明

- 本项目本身即作为 HYT Studio 的开源产品在官网上展示。
- 数据库默认位于 `apps/server/data/hyt.db`，后台可视化发布，无需改代码即可维护官网内容。
- 开源协议：[MIT](./LICENSE)。
