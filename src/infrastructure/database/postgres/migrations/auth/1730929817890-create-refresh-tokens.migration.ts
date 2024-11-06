import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokens1730929817890 implements MigrationInterface {
  name = 'CreateRefreshTokens1730929817890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "refresh_tokens"
                             (
                                 "id"        BIGSERIAL                 NOT NULL,
                                 "userId"    bigint                 NOT NULL,
                                 "token"     character varying(255) NOT NULL,
                                 "createdAt" TIMESTAMP              NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP              NOT NULL DEFAULT now(),
                                 "deletedAt" TIMESTAMP,
                                 CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
                             );
    COMMENT ON COLUMN "refresh_tokens"."userId" IS 'The user id which this refresh token belongs to';
    COMMENT ON COLUMN "refresh_tokens"."token" IS 'The hashed string of the actual token'`);
    await queryRunner.query(
      `COMMENT ON TABLE "refresh_tokens" IS 'Stores the refresh tokens that are issued to the user for authentication'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON TABLE "refresh_tokens" IS NULL`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
