import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [MulterModule, StorageModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
