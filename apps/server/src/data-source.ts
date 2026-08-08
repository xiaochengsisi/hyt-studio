import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './modules/users/user.entity';
import { Product } from './modules/products/product.entity';
import { Article } from './modules/articles/article.entity';
import { SiteConfig } from './modules/site-config/site-config.entity';
import { Submission } from './modules/submissions/submission.entity';
import { AuditLog } from './modules/audit-log/audit-log.entity';

/**
 * TypeORM CLI 数据源：用于生成 / 运行数据库迁移。
 * 与运行时 AppModule 配置保持一致，但 synchronize / migrationsRun 关闭，
 * 由 CLI 显式控制。
 */
export default new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './data/hyt-cli.db',
  entities: [User, Product, Article, SiteConfig, Submission, AuditLog],
  synchronize: false,
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
