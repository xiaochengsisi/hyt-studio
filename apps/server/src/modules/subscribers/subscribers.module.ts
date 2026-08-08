import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber } from './subscriber.entity';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';
import { MailModule } from '../mail/mail.module';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber]), MailModule, SiteConfigModule],
  controllers: [SubscribersController],
  providers: [SubscribersService],
  exports: [SubscribersService],
})
export class SubscribersModule {}
