import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Newsletter 订阅者：订阅时未确认，点击邮件链接确认后才纳入群发 */
@Entity('subscribers')
@Index('idx_subscriber_token', ['confirmToken'])
export class Subscriber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ nullable: true })
  confirmToken?: string;

  /** 确认 token 过期时间（24h 有效），过期后重新触发订阅可刷新 token */
  @Column({ type: 'datetime', nullable: true })
  confirmTokenExpiredAt?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;
}
