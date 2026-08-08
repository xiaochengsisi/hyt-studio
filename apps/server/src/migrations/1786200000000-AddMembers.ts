import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 新增团队成员表 members（前台 /team 页 + 后台管理）。
 * 用于展示工作室成员 / 贡献者，手动管理。
 */
export class AddMembers1786200000000 implements MigrationInterface {
    name = 'AddMembers1786200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "members" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "role" varchar NOT NULL DEFAULT (''), "bio" text, "avatarUrl" varchar, "github" varchar, "twitter" varchar, "email" varchar, "website" varchar, "sortOrder" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "members"`);
    }

}
