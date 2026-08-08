import { Module } from '@nestjs/common';
import { OgController } from './og.controller';
import { OgService } from './og.service';
import { ProductsModule } from '../products/products.module';
import { SiteConfigModule } from '../site-config/site-config.module';

@Module({
  imports: [ProductsModule, SiteConfigModule],
  controllers: [OgController],
  providers: [OgService],
})
export class OgModule {}
