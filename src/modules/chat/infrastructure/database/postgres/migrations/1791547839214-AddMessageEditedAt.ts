import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageEditedAt1791547839214 implements MigrationInterface {
  name = 'AddMessageEditedAt1791547839214';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_9efa90fa4b17f5d32d0ed1466fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" ADD "edited_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_ababfb5efdac0d785efb19722d7" FOREIGN KEY ("last_message_id") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_ababfb5efdac0d785efb19722d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."messages" DROP COLUMN "edited_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_9efa90fa4b17f5d32d0ed1466fc" FOREIGN KEY ("last_message_id") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }
}
