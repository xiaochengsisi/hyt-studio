import { Injectable } from '@nestjs/common';

/**
 * 极简内存 TTL 缓存：用于低频变更的公开读接口（产品列表 / 热门 / 标签 / 语言 / 统计 / 活动流），
 * 避免每次请求都重复查询数据库。写操作会短暂延迟可见（TTL 内），对官网可接受。
 */
@Injectable()
export class CacheService {
  private readonly store = new Map<string, { value: unknown; expires: number }>();

  get<T>(key: string): T | undefined {
    const item = this.store.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  set(key: string, value: unknown, ttlMs = 60_000): void {
    this.store.set(key, { value, expires: Date.now() + ttlMs });
  }

  clear(): void {
    this.store.clear();
  }
}
