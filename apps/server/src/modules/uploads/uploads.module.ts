import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { StorageModule } from '../storage/storage.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MulterModule, StorageModule, MediaModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
