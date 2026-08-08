import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * P1 批次表结构：
 * - products / articles 增加 scheduledAt（定时发布）
 * - site_config 增加 SMTP 邮件字段
 * - revisions（修订历史）
 * - media（媒体库）
 * - topics + topic_products（专题，M2M 关联产品）
 * - subscribers（Newsletter 订阅）
 */
export class AddP1Schema1786210000000 implements MigrationInterface {
    name = 'AddP1Schema1786210000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 定时发布字段
        await queryRunner.query(`ALTER TABLE "products" ADD "scheduledAt" datetime`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "scheduledAt" datetime`);

        // site_config SMTP 字段
        await queryRunner.query(`ALTER TABLE "site_config" ADD "smtpHost" varchar`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "smtpPort" integer`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "smtpSecure" boolean`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "smtpUser" varchar`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "smtpPass" text`);
        await queryRunner.query(`ALTER TABLE "site_config" ADD "smtpFrom" varchar`);

        // 修订历史
        await queryRunner.query(`CREATE TABLE "revisions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" integer NOT NULL, "snapshot" text NOT NULL, "username" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "idx_revision_entity" ON "revisions" ("entityType", "entityId")`);

        // 媒体库
        await queryRunner.query(`CREATE TABLE "media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "url" varchar NOT NULL, "filename" varchar NOT NULL, "mimetype" varchar, "size" integer, "storageKey" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);

        // 专题 + 关联表
        await queryRunner.query(`CREATE TABLE "topics" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slug" varchar NOT NULL, "name" varchar NOT NULL, "description" text, "coverUrl" varchar, "sortOrder" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_topics_slug" UNIQUE ("slug"))`);
        await queryRunner.query(`CREATE TABLE "topic_products" ("topicId" integer NOT NULL, "productId" integer NOT NULL, CONSTRAINT "FK_topic_products_topic" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "FK_topic_products_product" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("topicId", "productId"))`);

        // Newsletter 订阅者
        await queryRunner.query(`CREATE TABLE "subscribers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "confirmed" boolean NOT NULL DEFAULT (0), "confirmToken" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_subscribers_email" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE INDEX "idx_subscriber_token" ON "subscribers" ("confirmToken")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_subscriber_token"`);
        await queryRunner.query(`DROP TABLE "subscribers"`);
        await queryRunner.query(`DROP TABLE "topic_products"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP INDEX "idx_revision_entity"`);
        await queryRunner.query(`DROP TABLE "revisions"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "smtpFrom"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "smtpPass"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "smtpUser"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "smtpSecure"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "smtpPort"`);
        await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "smtpHost"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "scheduledAt"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "scheduledAt"`);
    }

}
