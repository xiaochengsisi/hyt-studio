import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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

  /** Public: single product by slug */
  @Public()
  @Get('slug/:slug')
  bySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug, true);
  }

  /** Public: 相关项目（按标签重合度） */
  @Public()
  @Get('slug/:slug/related')
  related(@Param('slug') slug: string): Promise<Product[]> {
    return this.productsService.findRelated(slug);
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

  @Post('admin')
  create(@Body() data: CreateProductDto): Promise<Product> {
    return this.productsService.create(data as any);
  }

  @Put('admin/:id')
  update(@Param('id') id: number, @Body() data: UpdateProductDto): Promise<Product> {
    return this.productsService.update(id, data as any);
  }

  @Delete('admin/:id')
  remove(@Param('id') id: number): Promise<void> {
    return this.productsService.remove(Number(id));
  }
}
