import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Article, BulkActionResult, BulkActionPayload, Paginated } from '@hyt/shared';
import { ArticlesService, QueryArticles } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('articles')
@Controller('api/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @Get()
  list(@Query() query: QueryArticles): Promise<Paginated<Article>> {
    return this.articlesService.list({ ...query, status: query.status || 'published' });
  }

  @Public()
  @Get('slug/:slug')
  bySlug(@Param('slug') slug: string): Promise<Article> {
    return this.articlesService.findBySlug(slug, true);
  }

  @Get('admin')
  adminList(@Query() query: QueryArticles): Promise<Paginated<Article>> {
    return this.articlesService.list(query);
  }

  /** Admin: 批量操作（需置于 :id 之前） */
  @Post('admin/bulk')
  bulk(@Body() body: BulkActionPayload): Promise<BulkActionResult> {
    return this.articlesService.bulk(body.ids || [], body.action).then((affected) => ({ affected }));
  }

  @Get('admin/:id')
  adminDetail(@Param('id') id: number): Promise<Article> {
    return this.articlesService.findById(id);
  }

  @Post('admin')
  create(@Body() data: CreateArticleDto): Promise<Article> {
    return this.articlesService.create(data as any);
  }

  @Put('admin/:id')
  update(@Param('id') id: number, @Body() data: UpdateArticleDto): Promise<Article> {
    return this.articlesService.update(id, data as any);
  }

  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.articlesService.remove(id);
  }
}