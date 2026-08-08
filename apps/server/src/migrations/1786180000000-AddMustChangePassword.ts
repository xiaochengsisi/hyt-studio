import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMustChangePassword1786180000000 implements MigrationInterface {
    name = 'AddMustChangePassword1786180000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "mustChangePassword" boolean NOT NULL DEFAULT (0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mustChangePassword"`);
    }

}
