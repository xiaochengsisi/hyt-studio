import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 为 subscribers 表添加 confirm_token_expired_at 字段。
 * 订阅确认 token 现在有 24h 有效期，过期后需重新触发订阅获取新链接。
 */
export class AddSubscriberTokenExpiry1786240000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscribers" ADD COLUMN "confirm_token_expired_at" datetime NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite 不支持 DROP COLUMN，创建临时表迁移数据
    await queryRunner.query(`
      CREATE TABLE "subscribers_backup" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "email" varchar NOT NULL UNIQUE,
        "confirmed" boolean NOT NULL DEFAULT 0,
        "confirm_token" varchar NULL,
        "created_at" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await queryRunner.query(`
      INSERT INTO "subscribers_backup" ("id","email","confirmed","confirm_token","created_at")
      SELECT "id","email","confirmed","confirm_token","created_at" FROM "subscribers"
    `);
    await queryRunner.query(`DROP TABLE "subscribers"`);
    await queryRunner.query(`ALTER TABLE "subscribers_backup" RENAME TO "subscribers"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_subscriber_token" ON "subscribers" ("confirm_token")`,
    );
  }
}
