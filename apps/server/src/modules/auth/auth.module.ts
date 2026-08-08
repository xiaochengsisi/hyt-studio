import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const isProd = config.get<string>('NODE_ENV') === 'production';
        if (isProd && (!secret || secret.length < 16)) {
          // 生产环境缺少强密钥直接启动失败，避免静默使用弱密钥
          throw new Error(
            '生产环境必须配置 JWT_SECRET（至少 16 位随机字符串），请检查 .env',
          );
        }
        // 开发环境兜底，仅便于本地起服务
        return {
          secret: secret || 'dev-only-insecure-secret-change-me',
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}