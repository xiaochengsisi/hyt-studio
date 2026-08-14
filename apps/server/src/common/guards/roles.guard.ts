import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 角色守卫（全局注册）。
 * 仅当接口标注了 @Roles(...) 时才校验角色；未标注的路由（公开接口 / 仅登录接口）
 * 直接放行，不影响现有公开接口。与全局 JwtAuthGuard 配合：JwtAuthGuard 负责"是否登录"，
 * RolesGuard 负责"登录者角色是否足够"。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) {
      throw new ForbiddenException('无访问权限');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('权限不足，需要管理员角色');
    }
    return true;
  }
}
