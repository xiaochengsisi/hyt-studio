import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1786175972726 implements MigrationInterface {
    name = 'InitSchema1786175972726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('admin'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slug" varchar NOT NULL, "name" varchar NOT NULL, "tagline" varchar NOT NULL DEFAULT (''), "description" text NOT NULL DEFAULT (''), "content" text, "logoUrl" varchar, "screenshots" text, "tags" varchar, "repoUrl" varchar, "homepage" varchar, "docsUrl" varchar, "version" varchar, "status" varchar NOT NULL DEFAULT ('draft'), "featured" boolean NOT NULL DEFAULT (0), "sortOrder" integer NOT NULL DEFAULT (0), "seoTitle" varchar, "seoDescription" text, "seoKeywords" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_464f927ae360106b783ed0b4106" UNIQUE ("slug"))`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "slug" varchar NOT NULL, "title" varchar NOT NULL, "summary" text NOT NULL DEFAULT (''), "content" text, "coverUrl" varchar, "tags" varchar, "status" varchar NOT NULL DEFAULT ('draft'), "publishedAt" datetime, "seoTitle" varchar, "seoDescription" text, "seoKeywords" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"))`);
        await queryRunner.query(`CREATE TABLE "site_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "siteName" varchar NOT NULL DEFAULT ('HYT Studio'), "slogan" varchar NOT NULL DEFAULT (''), "description" text NOT NULL DEFAULT (''), "siteUrl" varchar, "content" text, "logoUrl" varchar, "github" varchar, "email" varchar, "twitter" varchar, "icp" varchar, "policeRecord" varchar, "analyticsCode" text, "seoKeywords" varchar, "seoOgImage" varchar, "seoRobots" varchar, "seoTwitter" varchar, "aiProvider" varchar, "aiBaseUrl" varchar, "aiApiKey" text, "aiModel" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "submissions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "tagline" varchar NOT NULL DEFAULT (''), "description" text NOT NULL DEFAULT (''), "repoUrl" varchar, "homepage" varchar, "author" varchar, "email" varchar, "status" varchar NOT NULL DEFAULT ('pending'), "reviewNote" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "audit_log" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "action" varchar NOT NULL, "method" varchar, "path" varchar NOT NULL, "target" varchar, "targetId" integer, "userId" integer, "username" varchar, "ip" varchar, "detail" text, "status" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "audit_log"`);
        await queryRunner.query(`DROP TABLE "submissions"`);
        await queryRunner.query(`DROP TABLE "site_config"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
