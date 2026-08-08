import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { Submission } from '../submissions/submission.entity';
import { AuditLog } from '../audit-log/audit-log.entity';
import { Member } from '../members/member.entity';
import { Topic } from '../topics/topic.entity';
import { Subscriber } from '../subscribers/subscriber.entity';
import { Media } from '../media/media.entity';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Article,
      Submission,
      AuditLog,
      Member,
      Topic,
      Subscriber,
      Media,
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
