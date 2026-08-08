import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

export interface UserDto {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async ensureAdmin(username: string, password: string): Promise<void> {
    const existing = await this.findByUsername(username);
    if (existing) return;
    const hash = await bcrypt.hash(password, 10);
    // 由环境变量创建的默认管理员需在首次登录时强制改密
    await this.usersRepo.save(
      this.usersRepo.create({ username, password: hash, role: 'admin', mustChangePassword: true }),
    );
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  private toDto(u: User): UserDto {
    return { id: u.id, username: u.username, role: u.role, createdAt: u.createdAt };
  }

  async list(): Promise<UserDto[]> {
    const users = await this.usersRepo.find({ order: { id: 'ASC' } });
    return users.map((u) => this.toDto(u));
  }

  async create(username: string, password: string, role = 'admin'): Promise<UserDto> {
    const name = (username || '').trim();
    if (name.length < 3) throw new BadRequestException('用户名至少 3 个字符');
    if (!password || password.length < 6) throw new BadRequestException('密码至少 6 个字符');
    const existing = await this.findByUsername(name);
    if (existing) throw new ConflictException(`用户名「${name}」已存在`);
    const hash = await bcrypt.hash(password, 10);
    const saved = await this.usersRepo.save(
      this.usersRepo.create({ username: name, password: hash, role }),
    );
    return this.toDto(saved);
  }

  async updatePassword(id: number, newPassword: string): Promise<UserDto> {
    if (!newPassword || newPassword.length < 6)
      throw new BadRequestException('密码至少 6 个字符');
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    user.password = await bcrypt.hash(newPassword, 10);
    const saved = await this.usersRepo.save(user);
    return this.toDto(saved);
  }

  /** 首次登录强制改密：需校验旧密码，改完清除 mustChangePassword 标志 */
  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<User> {
    if (!newPassword || newPassword.length < 6)
      throw new BadRequestException('新密码至少 6 个字符');
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new BadRequestException('原密码错误');
    if (oldPassword === newPassword)
      throw new BadRequestException('新密码不能与原密码相同');
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    return this.usersRepo.save(user);
  }

  async remove(id: number, operatorId: number): Promise<void> {
    if (id === operatorId) throw new BadRequestException('不能删除当前登录的账号');
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('用户不存在');
    const admins = await this.usersRepo.count({ where: { role: 'admin' } });
    if (user.role === 'admin' && admins <= 1)
      throw new BadRequestException('至少保留一个管理员账号');
    await this.usersRepo.remove(user);
  }
}