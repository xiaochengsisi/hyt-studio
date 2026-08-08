import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_MCP_KEY } from '../decorators/allow-password-change.decorator';
import { JwtUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('请先登录');
    }
    // 首次登录强制改密：mcp 用户仅能访问标注了 @AllowPasswordChange() 的接口
    const jwtUser = user as JwtUser;
    if (jwtUser.mcp) {
      const allowMcp = this.reflector.getAllAndOverride<boolean>(ALLOW_MCP_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!allowMcp) {
        throw new ForbiddenException('请先修改默认密码后再使用后台');
      }
    }
    return user;
  }
}