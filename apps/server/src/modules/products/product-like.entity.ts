import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * 产品点赞记录：按匿名 ID（前端 localStorage 生成的 UUID）去重，
 * 同一 anonId 对同一产品只能点赞一次。
 */
@Entity('product_likes')
@Index('idx_like_product_anon', ['productId', 'anonId'], { unique: true })
export class ProductLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  anonId: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: string;
}
