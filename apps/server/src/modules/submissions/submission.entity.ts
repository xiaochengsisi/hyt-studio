import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  /** 项目名称 */
  @Column()
  name: string;

  @Column({ default: '' })
  tagline: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ nullable: true })
  repoUrl?: string;

  @Column({ nullable: true })
  homepage?: string;

  @Column({ nullable: true })
  author?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  /** 审核备注 */
  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: string;
}