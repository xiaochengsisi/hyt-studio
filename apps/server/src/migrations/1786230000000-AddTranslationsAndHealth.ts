import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * P3-1 多语言内容：translations 表
 * P3-2 项目健康度：纯计算字段，无需建表
 */
export class AddTranslations1786230000000 implements MigrationInterface {
  name = 'AddTranslations1786230000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "translations" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "entityType" varchar NOT NULL,
      "entityId" integer NOT NULL,
      "locale" varchar NOT NULL,
      "fields" text NOT NULL,
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
      "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
    )`);
    await queryRunner.query(`CREATE INDEX "idx_translation_entity" ON "translations" ("entityType", "entityId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_translation_entity_locale" ON "translations" ("entityType", "entityId", "locale")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_translation_entity_locale"`);
    await queryRunner.query(`DROP INDEX "idx_translation_entity"`);
    await queryRunner.query(`DROP TABLE "translations"`);
  }
}
