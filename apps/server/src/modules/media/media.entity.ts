import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 媒体库文件记录：每次上传留档，便于后台统一管理 / 删除 */
@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  filename: string;

  @Column({ nullable: true })
  mimetype?: string;

  @Column({ nullable: true })
  size?: number;

  /** 存储内的文件名 / key（用于删除时定位） */
  @Column({ nullable: true })
  storageKey?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;
}
