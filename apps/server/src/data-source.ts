import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './modules/users/user.entity';
import { Product } from './modules/products/product.entity';
import { ProductLike } from './modules/products/product-like.entity';
import { Article } from './modules/articles/article.entity';
import { SiteConfig } from './modules/site-config/site-config.entity';
import { Submission } from './modules/submissions/submission.entity';
import { AuditLog } from './modules/audit-log/audit-log.entity';
import { Member } from './modules/members/member.entity';
import { Revision } from './modules/revisions/revision.entity';
import { Media } from './modules/media/media.entity';
import { Topic } from './modules/topics/topic.entity';
import { Subscriber } from './modules/subscribers/subscriber.entity';
import { Translation } from './modules/translations/translation.entity';

/**
 * TypeORM CLI 数据源：用于生成 / 运行数据库迁移。
 * 实体列表需与运行时 AppModule 保持一致（13 个），否则 CLI 生成的迁移会漏表。
 * synchronize / migrationsRun 关闭，由 CLI 显式控制。
 */
export default new DataSource({
  type: 'sqlite',
  database: process.env.DB_PATH || './data/hyt-cli.db',
  entities: [
    User,
    Product,
    ProductLike,
    Article,
    SiteConfig,
    Submission,
    AuditLog,
    Member,
    Revision,
    Media,
    Topic,
    Subscriber,
    Translation,
  ],
  synchronize: false,
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
