import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { OgService } from './og.service';

@ApiTags('og')
@Controller('api/og')
export class OgController {
  constructor(private readonly ogService: OgService) {}

  /** Public: 产品分享卡片图（1200×630 PNG） */
  @Public()
  @Get('product/:slug.png')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'public, max-age=3600')
  async productCard(@Param('slug') slug: string): Promise<Buffer> {
    return this.ogService.productCard(slug);
  }
}
