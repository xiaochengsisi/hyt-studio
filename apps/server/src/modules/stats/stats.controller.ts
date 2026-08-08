import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardStats } from '@hyt/shared';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** 管理员：仪表盘聚合统计 */
  @Get('dashboard')
  dashboard(): Promise<DashboardStats> {
    return this.statsService.getDashboardStats();
  }
}
