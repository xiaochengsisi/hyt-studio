import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Roles('admin')
@Controller('api/audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /** 管理员：查看操作审计日志 */
  @Get()
  list(@Query('page') page = '1', @Query('pageSize') pageSize = '50') {
    return this.auditLogService.list(Number(page) || 1, Number(pageSize) || 50);
  }
}
