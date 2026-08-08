import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SiteConfig } from '@hyt/shared';
import { SiteConfigService } from './site-config.service';
import { UpdateSiteConfigDto } from './dto/site-config.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('site-config')
@Controller('api/site-config')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  /** 公开配置（不含 AI Key 等敏感字段） */
  @Public()
  @Get()
  getConfig(): Promise<SiteConfig> {
    return this.siteConfigService.getConfig();
  }

  /** 管理员配置（含 AI Key，需登录） */
  @Get('admin')
  getAdminConfig(): Promise<SiteConfig> {
    return this.siteConfigService.getAdminConfig();
  }

  @Put()
  updateConfig(@Body() data: UpdateSiteConfigDto): Promise<SiteConfig> {
    return this.siteConfigService.updateConfig(data as any);
  }
}