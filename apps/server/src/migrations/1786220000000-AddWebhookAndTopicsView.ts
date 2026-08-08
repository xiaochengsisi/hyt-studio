import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add webhookUrls column to site_config (P2-4 Webhook 推送).
 * 注：dashboard 字段扩展均为虚拟计算字段，无需建表。
 */
export class AddWebhookAndTopicsView1786220000000 implements MigrationInterface {
  name = 'AddWebhookAndTopicsView1786220000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_config" ADD "webhookUrls" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "site_config" DROP COLUMN "webhookUrls"`);
  }
}
