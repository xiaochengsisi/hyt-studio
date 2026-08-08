import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivityItem, DashboardStats, SiteStats } from '@hyt/shared';
import { StatsService } from './stats.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('stats')
@Controller('api/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** 管理员：仪表盘聚合统计 */
  @Get('dashboard')
  dashboard(): Promise<DashboardStats> {
    return this.statsService.getDashboardStats();
  }

  /** Public: 前台首页聚合统计数字带 */
  @Public()
  @Get('public')
  publicStats(): Promise<SiteStats> {
    return this.statsService.getPublicStats();
  }

  /** Public: 首页活动流（最近产品上架 / 文章发布 / 版本发布） */
  @Public()
  @Get('activity')
  activity(@Query('limit') limit?: number): Promise<ActivityItem[]> {
    return this.statsService.getActivity(Number(limit) || 8);
  }
}
