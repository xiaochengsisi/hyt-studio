import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginResult } from '@hyt/shared';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { AllowPasswordChange } from '../../common/decorators/allow-password-change.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  login(@Body() payload: LoginDto): Promise<LoginResult> {
    return this.authService.login(payload);
  }

  @Get('me')
  @AllowPasswordChange()
  me(@CurrentUser() user: JwtUser) {
    return user;
  }

  /** 首次登录强制改密：校验原密码后更新，返回不含 mcp 的新令牌 */
  @AllowPasswordChange()
  @Post('change-password')
  changePassword(
    @CurrentUser() user: JwtUser,
    @Body() payload: ChangePasswordDto,
  ): Promise<LoginResult> {
    return this.authService.changePassword(user.id, payload.oldPassword, payload.newPassword);
  }
}