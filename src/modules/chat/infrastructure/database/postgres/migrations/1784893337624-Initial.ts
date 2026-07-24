import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1784893337624 implements MigrationInterface {
  name = 'Initial1784893337624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "chat"."messages_type_enum" AS ENUM('TEXT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat"."messages" ("id" uuid NOT NULL, "text" text NOT NULL, "type" "chat"."messages_type_enum" NOT NULL DEFAULT 'TEXT', "sender_id" uuid NOT NULL, "conversation_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "conversationId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "messages_sender_id_idx" ON "chat"."messages"  ("sender_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "chat"."conversations_type_enum" AS ENUM('DIRECT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat"."conversations" ("id" uuid NOT NULL, "title" character varying, "picture" character varying, "identifier" character varying, "type" "chat"."conversations_type_enum" NOT NULL DEFAULT 'DIRECT', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "conversations_identifier_uniq" ON "chat"."conversations"  ("identifier") `,
    );
    await queryRunner.query(
      `CREATE TABLE "chat"."conversation_members" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "conversation_id" uuid NOT NULL, "last_seen_message_id" uuid, "last_message_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "last_message" uuid, CONSTRAINT "REL_ae81cc388649f0c1348c155c82" UNIQUE ("last_seen_message_id"), CONSTRAINT "REL_9efa90fa4b17f5d32d0ed1466f" UNIQUE ("last_message"), CONSTRAINT "PK_33146a476696a973a14d931e675" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "chat"."deleted_messages" ("user_id" uuid NOT NULL, "message_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_291432ce5670ad7a99d1ec20818" PRIMARY KEY ("user_id", "message_id"))`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "chat"."deleted_messages" IS 'messages that are deleted for users'`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "chat"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_sender_id_fk" FOREIGN KEY ("sender_id") REFERENCES "chat"."conversation_members"("id") ON DELETE NO ACTION ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_36340a1704b039608e34244511f" FOREIGN KEY ("conversation_id") REFERENCES "chat"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_ae81cc388649f0c1348c155c828" FOREIGN KEY ("last_seen_message_id") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_9efa90fa4b17f5d32d0ed1466fc" FOREIGN KEY ("last_message") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."deleted_messages" ADD CONSTRAINT "FK_af4864dee9672d02ce3d5ecdfa6" FOREIGN KEY ("message_id") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat"."deleted_messages" DROP CONSTRAINT "FK_af4864dee9672d02ce3d5ecdfa6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_9efa90fa4b17f5d32d0ed1466fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_ae81cc388649f0c1348c155c828"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_36340a1704b039608e34244511f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" DROP CONSTRAINT "messages_sender_id_fk"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "chat"."deleted_messages" IS NULL`,
    );
    await queryRunner.query(`DROP TABLE "chat"."deleted_messages"`);
    await queryRunner.query(`DROP TABLE "chat"."conversation_members"`);
    await queryRunner.query(
      `DROP INDEX "chat"."conversations_identifier_uniq"`,
    );
    await queryRunner.query(`DROP TABLE "chat"."conversations"`);
    await queryRunner.query(`DROP TYPE "chat"."conversations_type_enum"`);
    await queryRunner.query(`DROP INDEX "chat"."messages_sender_id_idx"`);
    await queryRunner.query(`DROP TABLE "chat"."messages"`);
    await queryRunner.query(`DROP TYPE "chat"."messages_type_enum"`);
  }
}
