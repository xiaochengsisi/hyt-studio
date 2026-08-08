import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'change-me',
    });
  }

  validate(payload: Omit<JwtUser, 'id'> & { sub: number }): JwtUser {
    if (!payload || payload.sub === undefined) {
      throw new UnauthorizedException('无效的令牌');
    }
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}