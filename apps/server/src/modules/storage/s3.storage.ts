import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { StoragePort, StoredFile } from './storage.interface';

/**
 * S3 / 对象存储实现。使用 @aws-sdk/client-s3（需自行安装）。
 * 通过 STORAGE_DRIVER=s3 启用，并配置 S3_ENDPOINT / S3_REGION / S3_BUCKET /
 * S3_ACCESS_KEY / S3_SECRET_KEY / S3_PUBLIC_BASE。
 *
 * 未安装 @aws-sdk/client-s3 时调用会抛出明确错误，不影响本地开发构建。
 */
@Injectable()
export class S3Storage implements StoragePort {
  private readonly bucket = process.env.S3_BUCKET || '';
  private readonly publicBase = (process.env.S3_PUBLIC_BASE || '').replace(/\/+$/, '');

  async save(file: { buffer: Buffer; originalname: string }): Promise<StoredFile> {
    let S3Client: any;
    let PutObjectCommand: any;
    try {
      // 动态加载，避免在未启用 S3 时强制安装 @aws-sdk/client-s3
      const sdk = require('@aws-sdk/client-s3');
      S3Client = sdk.S3Client;
      PutObjectCommand = sdk.PutObjectCommand;
    } catch {
      throw new InternalServerErrorException(
        'S3 存储需要安装 @aws-sdk/client-s3：npm i @aws-sdk/client-s3',
      );
    }

    const ext = extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    const client = new S3Client({
      region: process.env.S3_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ACL: 'public-read',
      }),
    );

    const url = this.publicBase ? `${this.publicBase}/${filename}` : `https://${this.bucket}.s3.amazonaws.com/${filename}`;
    return { url, filename };
  }
}
