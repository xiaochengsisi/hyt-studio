import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../../common/decorators/current-user.decorator';

/** 鉴权 Cookie 名称，需与 AuthController 中设置的一致 */
const AUTH_COOKIE = 'hyt_admin_token';

/** 从 Cookie 读取令牌（防御 XSS，令牌不暴露给 JS），失败回退到 Bearer 头（兼容 Swagger/curl） */
function readAuthCookie(req: any): string | null {
  const header = req?.headers?.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === AUTH_COOKIE) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    const isProd = config.get<string>('NODE_ENV') === 'production';
    // 生产环境缺失或弱密钥直接启动失败，避免静默使用弱密钥签发令牌
    if (isProd && (!secret || secret.length < 16)) {
      throw new Error('生产环境必须配置 JWT_SECRET（至少 16 位随机字符串），请检查 .env');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => readAuthCookie(req),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret || 'dev-only-insecure-secret-change-me',
    });
  }

  validate(payload: Omit<JwtUser, 'id'> & { sub: number }): JwtUser {
    if (!payload || payload.sub === undefined) {
      throw new UnauthorizedException('无效的令牌');
    }
    return { id: payload.sub, username: payload.username, role: payload.role, mcp: payload.mcp };
  }
}
