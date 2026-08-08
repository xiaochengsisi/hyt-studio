import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Article])],
  providers: [SchedulerService],
})
export class SchedulerModule {}
