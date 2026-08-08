import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { SiteConfig } from '../site-config/site-config.entity';
import { SeoController } from './seo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Article, SiteConfig])],
  controllers: [SeoController],
})
export class SeoModule {}