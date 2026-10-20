import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientMessageIdToMessages1792100000000 implements MigrationInterface {
  name = 'AddClientMessageIdToMessages1792100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" ADD "client_message_id" character varying(255)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "messages_sender_id_client_message_id_uniq" ON "chat"."messages" ("conversation_id", "sender_id", "client_message_id") WHERE "client_message_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "chat"."messages_sender_id_client_message_id_uniq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" DROP COLUMN "client_message_id"`,
    );
  }
}
