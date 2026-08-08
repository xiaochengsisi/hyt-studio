import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductLike } from './product-like.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { RevisionsModule } from '../revisions/revisions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductLike]), RevisionsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}