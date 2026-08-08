import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 管理员操作审计日志 */
@Entity('audit_log')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** 操作类型：create / update / delete / review / login 等 */
  @Column()
  action: string;

  /** HTTP 方法 */
  @Column({ nullable: true })
  method?: string;

  /** 请求路径 */
  @Column()
  path: string;

  /** 操作目标类型（如 product / article） */
  @Column({ nullable: true })
  target?: string;

  /** 操作目标 ID */
  @Column({ nullable: true })
  targetId?: number;

  /** 操作者用户 ID */
  @Column({ nullable: true })
  userId?: number;

  /** 操作者用户名 */
  @Column({ nullable: true })
  username?: string;

  /** 客户端 IP */
  @Column({ nullable: true })
  ip?: string;

  /** 详情（JSON 字符串，如变更摘要） */
  @Column({ type: 'text', nullable: true })
  detail?: string;

  /** HTTP 状态码 */
  @Column({ nullable: true })
  status?: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;
}
