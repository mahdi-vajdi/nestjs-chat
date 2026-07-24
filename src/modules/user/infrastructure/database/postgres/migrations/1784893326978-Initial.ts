import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1784893326978 implements MigrationInterface {
  name = 'Initial1784893326978';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user"."users_role_enum" AS ENUM('USER')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user"."users" ("id" uuid NOT NULL, "email" character varying(150) NOT NULL, "username" character varying(40) NOT NULL, "password" character varying(255) NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "role" "user"."users_role_enum" NOT NULL DEFAULT 'USER', "avatar" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_email_uniq" ON "user"."users"  ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "users_username_uniq" ON "user"."users"  ("username") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user"."user_blocks" ("blocker_id" uuid NOT NULL, "blocked_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_48667515438e7d0f0fed998b193" PRIMARY KEY ("blocker_id", "blocked_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"."user_blocks" ADD CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf" FOREIGN KEY ("blocker_id") REFERENCES "user"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"."user_blocks" ADD CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1" FOREIGN KEY ("blocked_id") REFERENCES "user"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user"."user_blocks" DROP CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user"."user_blocks" DROP CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf"`,
    );
    await queryRunner.query(`DROP TABLE "user"."user_blocks"`);
    await queryRunner.query(`DROP INDEX "user"."users_username_uniq"`);
    await queryRunner.query(`DROP INDEX "user"."users_email_uniq"`);
    await queryRunner.query(`DROP TABLE "user"."users"`);
    await queryRunner.query(`DROP TYPE "user"."users_role_enum"`);
  }
}
