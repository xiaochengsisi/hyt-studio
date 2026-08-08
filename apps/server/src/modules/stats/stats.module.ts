import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { Submission } from '../submissions/submission.entity';
import { AuditLog } from '../audit-log/audit-log.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Article, Submission, AuditLog])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
