import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductLike } from './product-like.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { HealthService } from './health.service';
import { RevisionsModule } from '../revisions/revisions.module';
import { WebhookModule } from '../webhook/webhook.module';
import { TranslationsModule } from '../translations/translations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductLike]),
    RevisionsModule,
    WebhookModule,
    TranslationsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, HealthService],
  exports: [ProductsService],
})
export class ProductsModule {}