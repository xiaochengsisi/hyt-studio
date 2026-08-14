import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from './audit-log.service';

/** 解析 path → { action, target, targetId } */
function parseRoute(method: string, path: string): { action: string; target?: string; targetId?: number } {
  // 形如 /api/products/admin/12  或 /api/articles/admin/3
  const m = path.match(/\/api\/([a-z-]+)\/admin\/?(\d+)?/);
  if (m) {
    const target = m[1];
    const id = m[2] ? Number(m[2]) : undefined;
    const action =
      method === 'POST' ? 'create' : method === 'PUT' ? 'update' : method === 'DELETE' ? 'delete' : method.toLowerCase();
    return { action, target, targetId: id };
  }
  // 审核动作 /api/submissions/admin/:id/review
  const review = path.match(/\/api\/submissions\/admin\/(\d+)\/review/);
  if (review) return { action: 'review', target: 'submission', targetId: Number(review[1]) };
  // 登录 /api/auth/login
  if (path.includes('/api/auth/login')) return { action: 'login', target: 'auth' };
  return { action: method.toLowerCase() };
}

/** 全局审计拦截器：记录所有写操作（POST/PUT/DELETE）及登录 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const path = req.path || req.url;

    // 仅记录变更操作（POST/PUT/DELETE/PATCH）与登录，跳过审计日志接口自身
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isLogin = path.includes('/api/auth/login');
    const shouldLog = (isMutation && !path.startsWith('/api/audit-log')) || isLogin;
    if (!shouldLog) return next.handle();

    const user = (req as any).user as { id?: number; username?: string } | undefined;
    const route = parseRoute(method, path);
    const ip = req.ip || req.socket?.remoteAddress;

    // 只记录关键字段，避免存入敏感数据全文
    const bodySummary = req.body && typeof req.body === 'object'
      ? JSON.stringify(this.sanitize(req.body))
      : undefined;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditLogService.log({
            action: route.action,
            method,
            path,
            target: route.target,
            targetId: route.targetId,
            userId: user?.id,
            username: user?.username,
            ip,
            detail: bodySummary,
            status: 200,
          });
        },
        // 同时记录失败操作（如登录失败 / 越权 / 校验错误），用于发现暴力破解与异常调用
        error: (err: any) => {
          if (!shouldLog) return;
          this.auditLogService.log({
            action: route.action,
            method,
            path,
            target: route.target,
            targetId: route.targetId,
            userId: user?.id,
            username: user?.username,
            ip,
            detail: bodySummary,
            status: (err && err.status) || 500,
          });
        },
      }),
    );
  }

  /** 仅保留非敏感字段名，避免密码 / 密钥进入审计日志 */
  private sanitize(body: any): Record<string, unknown> {
    const safe: Record<string, unknown> = {};
    for (const key of Object.keys(body)) {
      if (/password|secret|token|apikey|key/i.test(key)) {
        safe[key] = '***';
      } else {
        safe[key] = typeof body[key] === 'string' && body[key].length > 200
          ? body[key].slice(0, 200) + '…'
          : body[key];
      }
    }
    return safe;
  }
}
