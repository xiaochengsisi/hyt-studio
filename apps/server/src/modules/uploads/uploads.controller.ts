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
import { Roles } from '../../common/decorators/roles.decorator';

const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'];

/**
 * 各图像类型的真实文件签名（magic bytes）。上传不仅校验扩展名，
 * 还校验文件头，防止把可执行文件 / polyglot 伪装成图片上传。
 */
const SIGNATURES: Record<string, number[][]> = {
  '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
  '.webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF（后续再校验 WEBP）
  '.ico': [[0x00, 0x00, 0x01, 0x00]],
};

function startsWithAny(buf: Buffer, sigs: number[][]): boolean {
  return sigs.some((sig) => sig.every((b, i) => buf[i] === b));
}

/**
 * 校验上传文件真实内容是否与扩展名匹配。
 * - 二进制图像：比对 magic bytes。
 * - SVG：作为文本解析，禁止内联 <script> / javascript: / 事件处理器等可执行内容。
 * 校验失败抛出 BadRequestException，上传即被拒绝。
 */
function validateImageContent(buf: Buffer, ext: string): void {
  if (ext === '.svg') {
    const head = buf.slice(0, 512).toString('utf-8').toLowerCase();
    if (!/^\s*(<\?xml|<!doctype\s+svg|<svg)/.test(head)) {
      throw new BadRequestException('SVG 文件内容非法');
    }
    const text = buf.toString('utf-8').toLowerCase();
    if (/<script|<iframe|javascript:|onload=|onerror=|onmouseover=/.test(text)) {
      throw new BadRequestException('SVG 包含不允许的脚本内容');
    }
    return;
  }
  if (!SIGNATURES[ext]) throw new BadRequestException('不支持的文件类型');
  if (!startsWithAny(buf, SIGNATURES[ext])) {
    throw new BadRequestException('文件内容与扩展名不符，可能为伪装文件');
  }
  if (ext === '.webp') {
    // 进一步确认 RIFF 容器内的格式为 WEBP
    const kind = buf.slice(8, 12).toString('ascii');
    if (kind !== 'WEBP') throw new BadRequestException('WebP 文件格式非法');
  }
}

@ApiTags('uploads')
@Roles('admin')
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
    const ext = extname(file.originalname).toLowerCase();
    // 二次校验：真实文件签名（防伪装 / 存储型 XSS）
    validateImageContent(file.buffer, ext);
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
