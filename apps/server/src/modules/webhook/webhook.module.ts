import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [SiteConfigModule],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
