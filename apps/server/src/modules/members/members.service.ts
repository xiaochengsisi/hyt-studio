import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member as MemberDto } from '@hyt/shared';
import { Member } from './member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly repo: Repository<Member>,
  ) {}

  private toDto(e: Member): MemberDto {
    return {
      id: e.id,
      name: e.name,
      role: e.role,
      bio: e.bio,
      avatarUrl: e.avatarUrl,
      github: e.github,
      twitter: e.twitter,
      email: e.email,
      website: e.website,
      sortOrder: e.sortOrder,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  /** 公开列表（按 sortOrder 升序） */
  async listPublic(): Promise<MemberDto[]> {
    const items = await this.repo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return items.map((e) => this.toDto(e));
  }

  /** 后台列表 */
  async listAll(): Promise<MemberDto[]> {
    const items = await this.repo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
    return items.map((e) => this.toDto(e));
  }

  async findById(id: number): Promise<Member> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('成员不存在');
    return entity;
  }

  async create(data: Partial<Member>): Promise<MemberDto> {
    const entity = this.repo.create(data);
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async update(id: number, data: Partial<Member>): Promise<MemberDto> {
    const entity = await this.findById(id);
    Object.assign(entity, data);
    const saved = await this.repo.save(entity);
    return this.toDto(saved);
  }

  async remove(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
