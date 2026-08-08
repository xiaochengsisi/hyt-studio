import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [SiteConfigModule],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailModule {}
