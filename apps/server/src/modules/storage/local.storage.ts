import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { StoragePort, StoredFile } from './storage.interface';

/** 本地文件存储：写入 uploads/ 目录，由静态资源服务对外提供 */
@Injectable()
export class LocalStorage implements StoragePort {
  private readonly dir = join(process.cwd(), 'uploads');

  async save(file: { buffer: Buffer; originalname: string }): Promise<StoredFile> {
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
    const ext = extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    writeFileSync(join(this.dir, filename), file.buffer);
    const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return { url: `${base}/uploads/${filename}`, filename };
  }

  async delete(filename: string): Promise<void> {
    try {
      const safe = join(this.dir, filename.replace(/^[/\\]+/, ''));
      if (existsSync(safe)) unlinkSync(safe);
    } catch {
      /* best-effort */
    }
  }
}
