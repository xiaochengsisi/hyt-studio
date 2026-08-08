import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 团队成员 / 贡献者。
 * 用于前台 /team 页展示工作室成员，手动管理（MVP）。
 */
@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  /** 角色 / 头衔（如：创始人 / 维护者 / 贡献者） */
  @Column({ default: '' })
  role: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  github?: string;

  @Column({ nullable: true })
  twitter?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  /** 排序值（越小越靠前） */
  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: string;

  /** 软删除：移除后可恢复 */
  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt?: string;
}
