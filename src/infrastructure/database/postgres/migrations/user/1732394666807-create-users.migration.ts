import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1732394666807 implements MigrationInterface {
  name = 'CreateUsers1732394666807';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "users"
                             (
                                 "id"        BIGSERIAL              NOT NULL,
                                 "email"     character varying(150) NOT NULL,
                                 "username"  character varying(40)  NOT NULL,
                                 "password"  character varying(255) NOT NULL,
                                 "firstName" character varying(100),
                                 "lastName"  character varying(100),
                                 "createdAt" TIMESTAMP              NOT NULL DEFAULT now(),
                                 "updatedAt" TIMESTAMP              NOT NULL DEFAULT now(),
                                 "deletedAt" TIMESTAMP,
                                 CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_USERS_EMAIL" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_USERS_USERNAME" ON "users" ("username") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_USERS_USERNAME"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_USERS_EMAIL"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
