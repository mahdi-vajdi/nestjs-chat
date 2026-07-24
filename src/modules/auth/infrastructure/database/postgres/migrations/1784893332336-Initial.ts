import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1784893332336 implements MigrationInterface {
  name = 'Initial1784893332336';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth"."refresh_tokens" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "token" text NOT NULL, "identifier" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")); COMMENT ON COLUMN "auth"."refresh_tokens"."token" IS 'The hashed string of the actual token'; COMMENT ON COLUMN "auth"."refresh_tokens"."identifier" IS 'A unique id to identify the jwt. usually a uuid'`,
    );
    await queryRunner.query(
      `CREATE INDEX "refresh_tokens_user_id_idx" ON "auth"."refresh_tokens"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "refresh_tokens_identifier_uniq" ON "auth"."refresh_tokens"  ("identifier") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "auth"."refresh_tokens_identifier_uniq"`,
    );
    await queryRunner.query(`DROP INDEX "auth"."refresh_tokens_user_id_idx"`);
    await queryRunner.query(`DROP TABLE "auth"."refresh_tokens"`);
  }
}
