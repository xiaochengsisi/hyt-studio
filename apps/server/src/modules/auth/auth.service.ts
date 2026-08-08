import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginPayload, LoginResult } from '@hyt/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: LoginPayload): Promise<LoginResult> {
    const user = await this.usersService.findByUsername(payload.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const valid = await this.usersService.validatePassword(user, payload.password);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as 'admin',
        createdAt: user.createdAt,
      },
    };
  }
}