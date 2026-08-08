# 贡献指南

感谢你考虑为 HYT Studio 贡献代码！本项目是一个开源工作室官网与内容管理系统，任何形式的贡献（Issue、PR、文档、建议）都欢迎。

## 开发环境准备

```bash
# 1. 克隆仓库
git clone <repo-url> && cd hyt

# 2. 安装依赖（monorepo workspaces）
npm install

# 3. 配置后端环境变量
cp apps/server/.env.example apps/server/.env
# 按需修改 .env，至少修改 ADMIN_PASSWORD 与 JWT_SECRET

# 4. 启动开发服务（后端 watch + 前台 + 后台）
npm run dev
```

- 后端 API：http://localhost:3000
- 前台官网：http://localhost:5175
- 管理后台：http://localhost:5174（默认 admin / 见 .env）

## 代码规范

- 已启用 ESLint + Prettier，提交前会通过 husky + lint-staged 自动校验与格式化。
- 提交前请本地跑一遍：`npm run lint && npm run build`。
- 后端写接口请使用 class-validator DTO，不要直接用 `Partial<Interface>`。
- 遵循现有目录结构与命名约定（详见 README 目录结构）。

## 提交规范（Conventional Commits）

```
<type>(<scope>): <subject>
```

常用 type：`feat`（新功能）、`fix`（修复）、`docs`（文档）、`refactor`、`test`、`chore`、`perf`。

示例：
```
feat(server): 为文章接口增加 DTO 校验
fix(web): 修复产品详情页 JSON-LD 未清理的问题
```

## PR 流程

1. 从 `main` 拉新分支：`git checkout -b feat/your-feature`
2. 保持单一职责，一个 PR 只做一件事
3. 如改动行为，请补充或更新测试
4. 确保通过：`npm run lint && npm run build && npm test`
5. 描述清楚改动目的与影响，关联相关 Issue

## 报告问题

请使用 `.github/ISSUE_TEMPLATE/` 中的模板提交 Issue，便于复现与定位。

## 行为准则

请保持友善、尊重，聚焦技术讨论。任何形式的人身攻击、歧视或骚扰行为均不被接受。
