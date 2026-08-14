import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginPayload, LoginResult } from '@hyt/shared';

/** JWT 有效期：与鉴权 Cookie 的 maxAge 保持一致（默认 7 天），可通过 JWT_EXPIRES_IN 环境变量覆盖 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** 登录失败锁定：同一账号连续失败达到阈值后锁定一段时间，缓解暴力破解 */
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** 账号 -> 失败计数 / 锁定截止时间（进程内存，重启后清零；足以阻挡在线爆破） */
  private readonly loginAttempts = new Map<string, { count: number; lockUntil: number }>();

  async login(payload: LoginPayload): Promise<LoginResult & { token: string }> {
    const username = (payload.username || '').trim().toLowerCase();
    // 防暴力破解：同一账号连续失败达阈值后临时锁定
    this.assertNotLocked(username);

    const user = await this.usersService.findByUsername(payload.username);
    const valid = user ? await this.usersService.validatePassword(user, payload.password) : false;
    if (!user || !valid) {
      this.recordLoginFailure(username);
      throw new UnauthorizedException('用户名或密码错误');
    }

    this.clearLoginFailures(username);
    const token = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        mcp: user.mustChangePassword,
      },
      { expiresIn: JWT_EXPIRES_IN as any },
    );
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as 'admin',
        createdAt: user.createdAt,
      },
      mustChangePassword: user.mustChangePassword,
    };
  }

  private assertNotLocked(username: string): void {
    const rec = this.loginAttempts.get(username);
    if (rec && rec.lockUntil > Date.now()) {
      const remainMin = Math.max(1, Math.ceil((rec.lockUntil - Date.now()) / 60000));
      throw new ForbiddenException(`登录尝试过于频繁，请 ${remainMin} 分钟后再试`);
    }
  }

  private recordLoginFailure(username: string): void {
    const rec = this.loginAttempts.get(username) || { count: 0, lockUntil: 0 };
    rec.count += 1;
    if (rec.count >= MAX_LOGIN_ATTEMPTS) {
      rec.lockUntil = Date.now() + LOGIN_LOCK_MS;
      rec.count = 0;
    }
    this.loginAttempts.set(username, rec);
  }

  private clearLoginFailures(username: string): void {
    this.loginAttempts.delete(username);
  }

  /** 首次登录强制改密：校验旧密码后更新，并签发不含 mcp 的新令牌 */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<LoginResult & { token: string }> {
    const user = await this.usersService.changePassword(userId, oldPassword, newPassword);
    const token = this.jwtService.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        mcp: false,
      },
      { expiresIn: JWT_EXPIRES_IN as any },
    );
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role as 'admin',
        createdAt: user.createdAt,
      },
      mustChangePassword: false,
    };
  }
}
