import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditEntry {
  action: string;
  method?: string;
  path: string;
  target?: string;
  targetId?: number;
  userId?: number;
  username?: string;
  ip?: string;
  detail?: string;
  status?: number;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /** 异步写入审计日志，不阻塞主流程 */
  log(entry: AuditEntry): void {
    this.repo.save(this.repo.create(entry)).catch(() => {
      // 审计日志写入失败不应影响业务流程
    });
  }

  async list(page = 1, pageSize = 50): Promise<{ items: AuditLog[]; total: number; page: number; pageSize: number }> {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }
}
