import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Article } from '../articles/article.entity';
import { Member } from '../members/member.entity';
import { Topic } from '../topics/topic.entity';
import { SiteConfigModule } from '../site-config/site-config.module';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Article, Member, Topic]),
    SiteConfigModule,
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
