import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BackupPayload } from '@hyt/shared';
import { BackupService } from './backup.service';

@ApiTags('backup')
@Controller('api/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /** 导出全站数据为 JSON 备份（附件下载） */
  @Get('export')
  async export(@Res() res: Response): Promise<void> {
    const payload = await this.backupService.export();
    const filename = `hyt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(payload, null, 2));
  }

  /** 导入备份（合并模式：已存在 slug 跳过） */
  @Post('import')
  import(@Body() payload: BackupPayload) {
    return this.backupService.import(payload);
  }
}
