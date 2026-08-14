import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createGzip } from 'zlib';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/transform.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';

/**
 * gzip 压缩中间件：基于 Node 内置 zlib 实现（零额外依赖）。
 * 只压缩文本类响应（JSON / HTML / JS / CSS / SVG），跳过已压缩与二进制内容。
 * 同时覆盖 NestJS 控制器响应与 express.static 静态文件（通过重写 res.write/end 生效）。
 */
function gzipCompression() {
  return (req: any, res: any, next: any) => {
    if (res.headersSent || res.getHeader('Content-Encoding')) return next();
    if (!/gzip/i.test(req.headers['accept-encoding'] || '')) return next();
    const ct = String(res.getHeader('Content-Type') || '');
    if (
      /image\/|video\/|audio\/|font\/|application\/pdf|application\/zip|application\/gzip|application\/octet-stream/i.test(
        ct,
      )
    ) {
      return next();
    }

    const gz = createGzip();
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');
    res.removeHeader('Content-Length');

    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    gz.on('data', (chunk) => origWrite(chunk));
    gz.on('end', () => origEnd());
    gz.on('error', () => origEnd());

    res.write = (chunk: any, ..._rest: any[]) => {
      gz.write(chunk);
      return true;
    };
    res.end = (chunk?: any, ..._rest: any[]) => {
      if (chunk) gz.write(chunk);
      gz.end();
      return res;
    };
    next();
  };
}

/**
 * 托管构建后的前端 SPA：静态资源 + history 模式 fallback。
 * 仅当目录存在时启用，故本地开发（无 public/admin-public）不受影响。
 */
function serveSpa(app: NestExpressApplication, root: string, urlPrefix: string): void {
  const indexFile = join(root, 'index.html');
  if (!existsSync(indexFile)) return;
  const indexHtml = readFileSync(indexFile, 'utf-8');
  // Vite 构建产物带内容 hash，位于 assets/ 目录下：可长缓存（immutable）；
  // index.html 每次重新校验（no-cache），保证发版后能拿到最新页面。
  const setHeaders = (res: any, filePath: string) => {
    if (/[\\/]assets[\\/]/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  };
  app.useStaticAssets(root, {
    prefix: urlPrefix ? `${urlPrefix}/` : undefined,
    setHeaders,
  });
  const express = app.getHttpAdapter().getInstance() as any;
  express.use((req: any, res: any, next: any) => {
    if (req.method !== 'GET') return next();
    const p = req.path as string;
    const underPrefix = urlPrefix ? p === urlPrefix || p.startsWith(`${urlPrefix}/`) : true;
    if (!underPrefix) return next();
    if (p.startsWith('/api/') || p.startsWith('/uploads/')) return next();
    // web 根 SPA 需让出 /admin 给后台
    if (!urlPrefix && p.startsWith('/admin')) return next();
    // 有扩展名的请求交给静态资源
    if (/\.[a-zA-Z0-9]{1,8}$/.test(p)) return next();
    return res.type('html').send(indexHtml);
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 安全响应头：X-Content-Type-Options、X-Frame-Options、HSTS 等。
  // CSP 关闭：生产 SPA 由 Vite 构建含内联 modulepreload，且后台支持注入统计代码，
  // 严格 CSP 会阻断功能；其余安全头（防 MIME 嗅探 / 点击劫持 / 强制 HTTPS）仍启用。
  // crossOriginResourcePolicy 放开为 cross-origin：开发环境前后端分离跨域时，
  // 前台 <img> 需直接加载后端 /uploads 资源；same-origin 会被浏览器阻断。
  // 生产环境单端口同源部署，该头不影响。
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // gzip 压缩：置于路由 / 静态资源之前，对 JSON/HTML/JS/CSS 响应生效
  app.use(gzipCompression());

  // Swagger / OpenAPI 文档：仅开发环境暴露，生产环境关闭以防 API 结构泄露
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('HYT Studio API')
      .setDescription('HYT Studio 官网与后台 REST API 文档')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // CORS 白名单：从 CORS_ORIGINS 读取逗号分隔来源，默认仅放行本地开发端口
  const corsOrigins = (process.env.CORS_ORIGINS ||
    'http://localhost:5173,http://localhost:5174,http://localhost:5175')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      // 无 origin（同源 / 服务端请求 / curl）或命中白名单则放行
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist 会剥离 DTO 未声明的字段（如 id/createdAt），防止越权覆盖
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Serve uploaded files statically（用户上传内容，可短缓存减少重复请求）
  // 安全头：对上传资源强制 nosniff，并以严格 CSP 阻断脚本（尤其 SVG 被直接作为文档打开时的脚本执行），
  // 作为「存储型 XSS」的深度防御。该 CSP 不影响 <img> 正常引用。
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res: any) => {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'");
    },
  });

  // 生产环境托管构建后的前台 / 后台 SPA（Docker 部署时 public/ 与 admin-public/ 存在）
  serveSpa(app, join(process.cwd(), 'public'), '');
  serveSpa(app, join(process.cwd(), 'admin-public'), '/admin');

  // 优雅关闭，便于 TypeORM 连接清理
  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`HYT Studio server running on http://localhost:${port}`);
}
bootstrap();