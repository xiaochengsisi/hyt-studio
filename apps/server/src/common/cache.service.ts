import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

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

  /** 删除单个 key（写操作后主动失效） */
  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** 定期清理过期条目，防止 Map 因写入后再也不读的 key 无限增长 */
  @Interval(5 * 60 * 1000)
  pruneExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.store) {
      if (now > item.expires) this.store.delete(key);
    }
  }
}
