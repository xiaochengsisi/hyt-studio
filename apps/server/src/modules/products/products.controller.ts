import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BulkActionResult, BulkActionPayload, Paginated, Product } from '@hyt/shared';
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
  bySlug(@Param('slug') slug: string, @Req() req: any): Promise<Product> {
    return this.productsService.findBySlug(slug, true, req.ip);
  }

  /** Public: 相关项目（按标签重合度） */
  @Public()
  @Get('slug/:slug/related')
  related(@Param('slug') slug: string): Promise<Product[]> {
    return this.productsService.findRelated(slug);
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
