import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitUser1729017770965 implements MigrationInterface {
  name = 'InitUser1729017770965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "users"
                             (
                                 "id"        BIGSERIAL                 NOT NULL,
                                 "email"     character varying(150) NOT NULL,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_USERS_EMAIL"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
