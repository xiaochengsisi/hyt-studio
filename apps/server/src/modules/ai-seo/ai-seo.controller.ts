import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiSeoResult } from '@hyt/shared';
import { AiSeoService } from './ai-seo.service';
import { AiSeoGenerateDto } from './dto/ai-seo-generate.dto';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('ai-seo')
@Roles('admin')
@Controller('api/ai-seo')
export class AiSeoController {
  constructor(private readonly aiSeoService: AiSeoService) {}

  /** 管理员：根据内容用 AI 生成 SEO 标题/描述/关键词 */
  @Post('generate')
  generate(
    @Body() payload: AiSeoGenerateDto,
    @CurrentUser() user: JwtUser,
  ): Promise<AiSeoResult> {
    return this.aiSeoService.generate(payload, String(user.id));
  }
}
