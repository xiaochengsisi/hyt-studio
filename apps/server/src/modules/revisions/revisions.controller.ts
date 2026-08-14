import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Revision } from '@hyt/shared';
import { RevisionsService } from './revisions.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('revisions')
@Roles('admin')
@Controller('api/revisions')
export class RevisionsController {
  constructor(private readonly revisionsService: RevisionsService) {}

  /** 列出某实体的修订历史 */
  @Get(':type/:id')
  list(@Param('type') type: 'product' | 'article', @Param('id') id: number): Promise<Revision[]> {
    return this.revisionsService.list(type, Number(id));
  }

  /** 获取单条修订 */
  @Get('item/:rid')
  getOne(@Param('rid') rid: number): Promise<Revision> {
    return this.revisionsService.getOne(Number(rid));
  }

  /** 回滚到指定修订 */
  @Post('item/:rid/rollback')
  rollback(@Param('rid') rid: number): Promise<Revision> {
    return this.revisionsService.rollback(Number(rid));
  }
}
