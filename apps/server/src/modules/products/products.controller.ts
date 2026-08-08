import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BulkActionResult, BulkActionPayload, HealthBadge, Paginated, Product } from '@hyt/shared';
import { ProductsService, QueryProducts } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('products')
@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** Public: published products for the frontend site */
  @Public()
  @Get()
  list(@Query() query: QueryProducts): Promise<Paginated<Product>> {
    return this.productsService.list({
      ...query,
      status: query.status || 'published',
    });
  }

  /** Public: 全部标签（按频次），供前台标签筛选 */
  @Public()
  @Get('tags')
  tags(): Promise<{ name: string; count: number }[]> {
    return this.productsService.listTags();
  }

  /** Public: 全部编程语言（按频次），供前台语言筛选 */
  @Public()
  @Get('languages')
  languages(): Promise<{ name: string; count: number }[]> {
    return this.productsService.listLanguages();
  }

  /** Public: 热门产品（综合浏览+点赞+star） */
  @Public()
  @Get('hot')
  hot(): Promise<Product[]> {
    return this.productsService.findHot(6);
  }

  /** Public: single product by slug */
  @Public()
  @Get('slug/:slug')
  bySlug(
    @Param('slug') slug: string,
    @Query('lang') lang: string | undefined,
    @Req() req: any,
  ): Promise<Product> {
    // 优先使用 ?lang= 参数，否则从 Accept-Language 头解析主语言
    const locale = lang || parseAcceptLanguage(req.headers['accept-language']);
    return this.productsService.findBySlug(slug, true, req.ip, locale);
  }

  /** Public: 相关项目（按标签重合度） */
  @Public()
  @Get('slug/:slug/related')
  related(@Param('slug') slug: string): Promise<Product[]> {
    return this.productsService.findRelated(slug);
  }

  /** Public: 项目健康度徽章（基于 GitHub 同步数据自动计算） */
  @Public()
  @Get('slug/:slug/health')
  async health(@Param('slug') slug: string): Promise<{ badges: HealthBadge[] }> {
    const badges = await this.productsService.computeHealth(slug);
    return { badges };
  }

  /** Public: 匿名点赞/取消点赞（按 anonId 去重） */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('slug/:slug/like')
  like(
    @Param('slug') slug: string,
    @Body() body: { anonId: string },
  ): Promise<{ liked: boolean; likeCount: number }> {
    return this.productsService.toggleLike(slug, body?.anonId);
  }

  /** Admin: all products (any status) */
  @Get('admin')
  adminList(@Query() query: QueryProducts): Promise<Paginated<Product>> {
    return this.productsService.list(query);
  }

  /** Admin: 批量操作（需置于 :id 之前，避免被通配匹配） */
  @Post('admin/bulk')
  bulk(@Body() body: BulkActionPayload): Promise<BulkActionResult> {
    return this.productsService.bulk(body.ids || [], body.action).then((affected) => ({ affected }));
  }

  /** Admin: product by id */
  @Get('admin/:id')
  adminDetail(@Param('id') id: number): Promise<Product> {
    return this.productsService.findById(id);
  }

  /** Admin: 同步 GitHub 数据 */
  @Post('admin/:id/sync-github')
  syncGithub(@Param('id') id: number): Promise<Product> {
    return this.productsService.syncGithub(Number(id));
  }

  @Post('admin')
  create(@Body() data: CreateProductDto, @Req() req: any): Promise<Product> {
    return this.productsService.create(data as any, req?.user?.username);
  }

  @Put('admin/:id')
  update(@Param('id') id: number, @Body() data: UpdateProductDto, @Req() req: any): Promise<Product> {
    return this.productsService.update(id, data as any, req?.user?.username);
  }

  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.productsService.remove(Number(id));
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

