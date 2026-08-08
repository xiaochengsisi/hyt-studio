import {
  BadRequestException,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { extname } from 'path';
import { STORAGE_PORT, StoragePort } from '../storage/storage.interface';
import { MediaService } from '../media/media.service';

const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];

@ApiTags('uploads')
@Controller('api/uploads')
export class UploadsController {
  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly mediaService: MediaService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // 使用内存存储，统一交给 StoragePort 落盘 / 上传对象存储
      storage: undefined,
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED.includes(ext)) {
          return cb(new BadRequestException('仅支持图片文件'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未接收到文件');
    const result = await this.storage.save({
      buffer: file.buffer,
      originalname: file.originalname,
    });
    // 记录到媒体库，便于后台统一管理 / 删除
    await this.mediaService.record({
      url: result.url,
      filename: file.originalname,
      storageKey: result.filename,
      mimetype: file.mimetype,
      size: file.size,
    });
    return { url: result.url };
  }
}
