import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revision } from './revision.entity';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { RevisionsService } from './revisions.service';
import { RevisionsController } from './revisions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Revision, Product, Article])],
  controllers: [RevisionsController],
  providers: [RevisionsService],
  exports: [RevisionsService],
})
export class RevisionsModule {}
