import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshToken1732394461311 implements MigrationInterface {
  name = 'CreateRefreshToken1732394461311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "refresh_tokens"
                             (
                                 "id"         BIGSERIAL              NOT NULL,
                                 "userId"     bigint                 NOT NULL,
                                 "token"      character varying(255) NOT NULL,
                                 "identifier" character varying      NOT NULL,
                                 "createdAt"  TIMESTAMP              NOT NULL DEFAULT now(),
                                 "updatedAt"  TIMESTAMP              NOT NULL DEFAULT now(),
                                 "deletedAt"  TIMESTAMP,
                                 CONSTRAINT "UQ_5715685bda5864ae5899034ad66" UNIQUE ("identifier"),
                                 CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
                             );
    COMMENT ON COLUMN "refresh_tokens"."userId" IS 'The user id which this refresh token belongs to';
    COMMENT ON COLUMN "refresh_tokens"."token" IS 'The hashed string of the actual token';
    COMMENT ON COLUMN "refresh_tokens"."identifier" IS 'A unique id to identify the jwt. usually a uuid'`);
    await queryRunner.query(
      `COMMENT ON TABLE "refresh_tokens" IS 'Stores the refresh tokens that are issued to the user for authentication'`,
    );
    await queryRunner.query(`ALTER TABLE "users"
        DROP CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON TABLE "refresh_tokens" IS NULL`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
