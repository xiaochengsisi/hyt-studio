import { Module } from '@nestjs/common';
import { STORAGE_PORT } from './storage.interface';
import { LocalStorage } from './local.storage';
import { S3Storage } from './s3.storage';

/** 按 STORAGE_DRIVER 选择存储实现，默认本地 */
@Module({
  providers: [
    {
      provide: STORAGE_PORT,
      useFactory: () => {
        const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
        if (driver === 's3') return new S3Storage();
        return new LocalStorage();
      },
    },
  ],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
