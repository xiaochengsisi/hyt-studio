import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TranslationsService, TranslationFields } from './translations.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('translations')
@Roles('admin')
@Controller('api/translations')
export class TranslationsController {
  constructor(private readonly service: TranslationsService) {}

  /** Admin: 列出某实体的全部翻译 */
  @Get(':type/:id')
  list(@Param('type') type: 'product' | 'article', @Param('id') id: number) {
    return this.service.list(type, Number(id));
  }

  /** Admin: 保存某 locale 的翻译 */
  @Post(':type/:id/:locale')
  set(
    @Param('type') type: 'product' | 'article',
    @Param('id') id: number,
    @Param('locale') locale: string,
    @Body() body: TranslationFields,
  ) {
    return this.service.set(type, Number(id), locale, body || {});
  }

  /** Admin: 删除某 locale 的翻译 */
  @Delete(':type/:id/:locale')
  remove(
    @Param('type') type: 'product' | 'article',
    @Param('id') id: number,
    @Param('locale') locale: string,
  ) {
    return this.service.remove(type, Number(id), locale);
  }
}
