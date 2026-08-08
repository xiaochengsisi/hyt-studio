import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'path';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { UsersService } from './modules/users/users.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { SiteConfigModule } from './modules/site-config/site-config.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { SeoModule } from './modules/seo/seo.module';
import { AiSeoModule } from './modules/ai-seo/ai-seo.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AuditInterceptor } from './modules/audit-log/audit.interceptor';
import { AuditLog } from './modules/audit-log/audit-log.entity';
import { StatsModule } from './modules/stats/stats.module';
import { HealthModule } from './modules/health/health.module';
import { User } from './modules/users/user.entity';
import { Product } from './modules/products/product.entity';
import { Article } from './modules/articles/article.entity';
import { SiteConfig } from './modules/site-config/site-config.entity';
import { Submission } from './modules/submissions/submission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 全局限流：默认每分钟 60 次，敏感接口（登录/提交）用 @Throttle 覆盖更严限制
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || join(process.cwd(), 'data', 'hyt.db'),
      entities: [User, Product, Article, SiteConfig, Submission, AuditLog],
      // 生产环境关闭 synchronize 以避免数据丢失，改用迁移；开发环境保留以方便迭代
      synchronize: process.env.NODE_ENV !== 'production',
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      migrationsRun: process.env.NODE_ENV === 'production',
      logging: false,
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    ArticlesModule,
    SiteConfigModule,
    UploadsModule,
    SubmissionsModule,
    SeoModule,
    AiSeoModule,
    AuditLogModule,
    StatsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    // Seed default admin from env on first boot
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    await this.usersService.ensureAdmin(username, password);
    console.log(`Default admin ready: ${username}`);
  }
}