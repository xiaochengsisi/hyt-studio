# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。

## [Unreleased]

### Added
- 引入后端 DTO 校验（class-validator）覆盖所有写接口
- 站点配置新增 AI SEO（生成式引擎优化）功能：后台配置 OpenAI 兼容服务商，产品/文章编辑页一键生成 SEO 标题/描述/关键词
- 前台详情页注入 schema.org JSON-LD 结构化数据（SoftwareApplication / Article）
- 操作审计日志模块，记录管理员写操作
- 健康检查端点 `GET /api/health`
- Dockerfile 与 docker-compose 一键部署方案
- ESLint + Prettier + husky/lint-staged 工程化配置
- 后端单元测试框架（Jest）与关键路径测试
- GitHub Actions CI（lint / typecheck / build / test）
- Swagger / OpenAPI 接口文档（`/api/docs`）
- 前端 i18n 基础设施与中英语言包
- 存储层抽象（本地 / S3 可切换）、产品与文章软删除、前台 404 页
- CONTRIBUTING、CHANGELOG、Issue / PR 模板与 LICENSE

### Security
- JWT 密钥缺失时生产环境启动失败（移除硬编码弱兜底）
- CORS 改为白名单，默认不再反射任意来源
- 生产环境关闭 TypeORM synchronize，改用迁移
- AI 生成接口增加请求超时与限流

## [0.1.0] - 2026-08-08

### Added
- Vue 3 + TypeScript 前台官网与独立管理后台
- NestJS + SQLite 后端，JWT 鉴权
- 开源项目展示、博客、关于页
- 产品/文章 CRUD、Markdown 编辑与多图截图上传
- 多管理员账号、项目提交申请与审核
- 全站页面内容后台可编辑（除底部版权）
- SEO 关键词 / OG / robots / Twitter 卡片配置
- RSS 与 sitemap 输出
- ICP / 公安备案与第三方统计代码注入
