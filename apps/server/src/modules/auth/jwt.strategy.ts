import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../../common/decorators/current-user.decorator';

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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