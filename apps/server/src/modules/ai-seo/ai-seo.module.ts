import { Module } from '@nestjs/common';
import { SiteConfigModule } from '../site-config/site-config.module';
import { AiSeoController } from './ai-seo.controller';
import { AiSeoService } from './ai-seo.service';

@Module({
  imports: [SiteConfigModule],
  controllers: [AiSeoController],
  providers: [AiSeoService],
})
export class AiSeoModule {}
