import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** 安全方法不参与 CSRF 校验（CSRF 只针对会改变状态的请求） */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** 从 Cookie 头中解析指定名称的值（项目未引入 cookie-parser，手动解析，零依赖） */
function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

/**
 * CSRF 双提交 Token 守卫（全局注册）。
 * 仅对「非公开 + 非安全方法 + 非 Bearer」的请求校验：请求头 X-CSRF-Token
 * 必须与 Cookie 中的 hyt_csrf 完全一致，否则拒绝（403）。
 * - @Public() 路由（如登录）跳过：这类是建立会话的入口，不要求携带 CSRF Token。
 * - 携带 Authorization: Bearer 的调用（Swagger / 脚本）跳过：走令牌鉴权即可。
 * - 同源 SPA + httpOnly 鉴权 Cookie + SameSite=lax 已提供基础防护，本守卫为纵深防御。
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    if (SAFE_METHODS.has(request.method)) return true;

    // Bearer 令牌调用（Swagger / 自动化脚本）不受 CSRF 限制
    if (request.headers?.authorization) return true;

    const csrfCookie = getCookieValue(request.headers?.cookie, 'hyt_csrf');
    const csrfHeader =
      (request.headers['x-csrf-token'] as string) || (request.headers['X-CSRF-Token'] as string);
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('CSRF 校验失败');
    }
    return true;
  }
}
