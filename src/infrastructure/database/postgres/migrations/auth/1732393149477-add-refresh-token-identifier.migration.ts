import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenIdentifier1732393149477
  implements MigrationInterface
{
  name = 'AddRefreshTokenIdentifier1732393149477';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_tokens"
        ADD "identifier" character varying NOT NULL`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "UQ_5715685bda5864ae5899034ad66" UNIQUE ("identifier")`);
    await queryRunner.query(
      `COMMENT ON COLUMN "refresh_tokens"."identifier" IS 'A unique id to identify the jwt. usually a uuid'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `COMMENT ON COLUMN "refresh_tokens"."identifier" IS 'A unique id to identify the jwt. usually a uuid'`,
    );
    await queryRunner.query(`ALTER TABLE "refresh_tokens"
        DROP CONSTRAINT "UQ_5715685bda5864ae5899034ad66"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens"
        DROP COLUMN "identifier"`);
  }
}
