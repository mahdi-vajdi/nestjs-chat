import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReplyToMessageId1792000000000 implements MigrationInterface {
  name = 'AddReplyToMessageId1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" ADD "reply_to_message_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "messages_reply_to_message_id_idx" ON "chat"."messages" ("reply_to_message_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_reply_to_message_id_fk" FOREIGN KEY ("reply_to_message_id") REFERENCES "chat"."messages"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" DROP CONSTRAINT "messages_reply_to_message_id_fk"`,
    );
    await queryRunner.query(
      `DROP INDEX "chat"."messages_reply_to_message_id_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" DROP COLUMN "reply_to_message_id"`,
    );
  }
}
