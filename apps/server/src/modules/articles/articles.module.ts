import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { RevisionsModule } from '../revisions/revisions.module';
import { WebhookModule } from '../webhook/webhook.module';
import { TranslationsModule } from '../translations/translations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), RevisionsModule, WebhookModule, TranslationsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}