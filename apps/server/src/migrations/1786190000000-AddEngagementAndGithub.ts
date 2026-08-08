import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 新增互动与 GitHub 数据：
 * - products 增加 viewCount/likeCount/language/category/github 同步字段
 * - 新增 product_likes 表（匿名点赞去重）
 * - site_config 增加 Giscus 评论配置字段
 */
export class AddEngagementAndGithub1786190000000 implements MigrationInterface {
    name = 'AddEngagementAndGithub1786190000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // products 互动与 GitHub 字段
        await queryRunner.query(`ALTER TABLE "products" ADD "viewCount" integer NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "likeCount" integer NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "language" varchar`);
        await queryRunner.query(`ALTER TABLE "products" ADD "category" varchar`);
        await queryRunner.query(`ALTER TABLE "products" ADD "githubStars" integer NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "githubForks" integer NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "githubOpenIssues" integer NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "githubLicense" varchar`);
        await queryRunner.query(`ALTER TABLE "products" ADD "githubUpdatedAt" datetime`);
        await queryRunner.query(`ALTER TABLE "products" ADD "githubSyncedAt" datetime`);

        // 点赞去重表
        await queryRunner.query(`CREATE TABLE "product_likes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "productId" integer NOT NULL, "anonId" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_product_likes_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_like_product_anon" ON "product_likes" ("productId", "anonId")`);

        // site_config Giscus 评论配置
        await queryRunner.query(`ALTER TABLE "site_config" ADD "giscusRepo" varchar`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "giscusRepoId" varchar`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "giscusCategory" varchar`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "giscusCategoryId" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "giscusCategoryId"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "giscusCategory"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "giscusRepoId"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "giscusRepo"`);
        await queryRunner.query(`DROP INDEX "idx_like_product_anon"`);
        await queryRunner.query(`DROP TABLE "product_likes"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "githubSyncedAt"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "githubUpdatedAt"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "githubLicense"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "githubOpenIssues"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "githubForks"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "githubStars"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "language"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "likeCount"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "viewCount"`);
    }

}
