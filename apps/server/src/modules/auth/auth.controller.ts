import { Body, Controller, Get, Post, Res, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginResult, User } from '@hyt/shared';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { AllowPasswordChange } from '../../common/decorators/allow-password-change.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

/** 鉴权 Cookie 名称（httpOnly，前端无法通过 JS 读取，规避 XSS 窃取令牌） */
const AUTH_COOKIE = 'hyt_admin_token';
/** CSRF 双提交令牌 Cookie 名称（非 httpOnly，前端可读以回传至 X-CSRF-Token 头） */
const CSRF_COOKIE = 'hyt_csrf';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 统一构建鉴权 Cookie 选项：httpOnly + 生产环境 Secure + SameSite */
  private authCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 与 JWT 默认有效期（7d）保持一致
    };
  }

  /** 统一构建 CSRF Cookie 选项：非 httpOnly（前端需读取以回传），同 SameSite 策略 */
  private csrfCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: false,
      secure: isProd,
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  /** 生成一次性 CSRF 令牌，并写入 Cookie（双提交校验用） */
  private issueCsrf(res: Response): string {
    const token = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, this.csrfCookieOptions());
    return token;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() payload: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResult> {
    const out = await this.authService.login(payload);
    res.cookie(AUTH_COOKIE, out.token, this.authCookieOptions());
    const csrfToken = this.issueCsrf(res);
    return { user: out.user, mustChangePassword: out.mustChangePassword, csrfToken };
  }

  @Get('me')
  @AllowPasswordChange()
  me(@CurrentUser() user: JwtUser, @Res({ passthrough: true }) res: Response) {
    const csrfToken = this.issueCsrf(res);
    return { ...user, csrfToken } as User & { csrfToken: string };
  }

  /** 首次登录强制改密：校验原密码后更新，并换发不含 mcp 的新令牌（同步刷新 Cookie） */
  @AllowPasswordChange()
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: JwtUser,
    @Body() payload: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResult> {
    const out = await this.authService.changePassword(
      user.id,
      payload.oldPassword,
      payload.newPassword,
    );
    res.cookie(AUTH_COOKIE, out.token, this.authCookieOptions());
    const csrfToken = this.issueCsrf(res);
    return { user: out.user, mustChangePassword: out.mustChangePassword, csrfToken };
  }

  /** 登出：清除 httpOnly 鉴权 Cookie 与 CSRF Cookie，使令牌在客户端失效 */
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
    res.clearCookie(CSRF_COOKIE, { path: '/' });
    return { success: true };
  }
}
