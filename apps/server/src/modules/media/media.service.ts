import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inject } from '@nestjs/common';
import { Media as MediaDto } from '@hyt/shared';
import { Media } from './media.entity';
import { STORAGE_PORT, StoragePort } from '../storage/storage.interface';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private readonly repo: Repository<Media>,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  private toDto(e: Media): MediaDto {
    return {
      id: e.id,
      url: e.url,
      filename: e.filename,
      mimetype: e.mimetype,
      size: e.size,
      createdAt: e.createdAt,
    };
  }

  /** 记录一次上传（在 UploadsController 上传成功后调用） */
  async record(input: {
    url: string;
    filename: string;
    storageKey?: string;
    mimetype?: string;
    size?: number;
  }): Promise<Media> {
    const entity = this.repo.create(input);
    const saved = await this.repo.save(entity);
    return saved;
  }

  async list(): Promise<MediaDto[]> {
    const items = await this.repo.find({ order: { id: 'DESC' } });
    return items.map((e) => this.toDto(e));
  }

  async remove(id: number): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('文件不存在');
    if (entity.storageKey) await this.storage.delete(entity.storageKey);
    await this.repo.remove(entity);
  }
}
