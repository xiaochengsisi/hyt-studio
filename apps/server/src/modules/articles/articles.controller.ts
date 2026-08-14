import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Article, BulkActionResult, BulkActionPayload, Paginated } from '@hyt/shared';
import { ArticlesService, QueryArticles } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

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
  bySlug(
    @Param('slug') slug: string,
    @Query('lang') lang: string | undefined,
    @Req() req: any,
  ): Promise<Article> {
    // 优先使用 ?lang= 参数，否则从 Accept-Language 头解析主语言
    const locale = lang || parseAcceptLanguage(req.headers['accept-language']);
    return this.articlesService.findBySlug(slug, true, locale);
  }

  @Roles('admin')
  @Get('admin')
  adminList(@Query() query: QueryArticles): Promise<Paginated<Article>> {
    return this.articlesService.list(query);
  }

  /** Admin: 批量操作（需置于 :id 之前） */
  @Roles('admin')
  @Post('admin/bulk')
  bulk(@Body() body: BulkActionPayload): Promise<BulkActionResult> {
    return this.articlesService.bulk(body.ids || [], body.action).then((affected) => ({ affected }));
  }

  @Roles('admin')
  @Get('admin/:id')
  adminDetail(@Param('id') id: number): Promise<Article> {
    return this.articlesService.findById(id);
  }

  @Roles('admin')
  @Post('admin')
  create(@Body() data: CreateArticleDto, @Req() req: any): Promise<Article> {
    return this.articlesService.create(data as any, req?.user?.username);
  }

  @Roles('admin')
  @Put('admin/:id')
  update(@Param('id') id: number, @Body() data: UpdateArticleDto, @Req() req: any): Promise<Article> {
    return this.articlesService.update(id, data as any, req?.user?.username);
  }

  @Roles('admin')
  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.articlesService.remove(id);
  }
}

/**
 * 解析 Accept-Language 头，取首选语言并规范化为 locale（如 en-US / zh-CN）。
 * 仅返回符合 `xx` 或 `xx-XX` 格式的语言代码；否则返回 undefined。
 */
function parseAcceptLanguage(header?: string): string | undefined {
  if (!header) return undefined;
  const first = header.split(',')[0]?.trim();
  if (!first) return undefined;
  // 形如 "zh-CN,zh;q=0.9" → 取分号前
  const raw = first.split(';')[0].trim();
  if (!raw) return undefined;
  const parts = raw.split('-');
  if (parts.length === 1) {
    return parts[0].toLowerCase();
  }
  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}