# syntax=docker/dockerfile:1
#
# HYT Studio 一体化镜像
# 单容器同时提供：后端 API（NestJS）+ 前台官网 SPA + 后台管理 SPA
# 构建后通过 http://host:3000 访问前台，http://host:3000/admin 访问后台
#

# ---------- 1. 构建阶段：安装依赖并编译所有 workspace ----------
FROM node:20-slim AS builder

# sqlite3 原生模块按需编译的兜底工具链（多数情况下直接用预编译二进制）
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /repo

# 先拷贝清单以最大化 Docker 层缓存
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci --legacy-peer-deps

# 构建前台 / 后台 / 后端
RUN npm run build

# ---------- 2. 运行阶段：仅保留生产依赖与构建产物 ----------
FROM node:20-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/hyt.db

WORKDIR /app

# 拷贝清单与 workspace 声明，安装生产依赖（剔除 devDependencies）
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci --legacy-peer-deps --omit=dev \
 && npm cache clean --force

# 拷贝构建产物
COPY --from=builder /repo/apps/server/dist        ./dist
COPY --from=builder /repo/apps/web/dist           ./public
COPY --from=builder /repo/apps/admin/dist         ./admin-public

# 运行时数据目录（建议通过 volume 持久化）
RUN mkdir -p /app/data /app/uploads

# 健康检查：后端 /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

EXPOSE 3000

# process.cwd() = /app，main.js 解析 require 时向上找到 /app/node_modules
CMD ["node", "dist/main.js"]
