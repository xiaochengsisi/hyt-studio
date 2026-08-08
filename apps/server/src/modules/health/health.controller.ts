import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /** 公开健康检查：返回服务与数据库连通性 */
  @Public()
  @Get()
  async health() {
    let db: 'up' | 'down' = 'up';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      db = 'down';
    }
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      db,
    };
  }
}
