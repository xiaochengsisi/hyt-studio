import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/** 全局缓存模块：任意模块可直接注入 CacheService。 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
