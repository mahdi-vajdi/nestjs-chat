import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1783589666264 implements MigrationInterface {
    name = 'InitialMigration1783589666264'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "user"`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "chat"`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "auth"`);
        await queryRunner.query(`CREATE TYPE "user"."users_role_enum" AS ENUM('USER')`);
        await queryRunner.query(`CREATE TABLE "user"."users" ("id" BIGSERIAL NOT NULL, "email" character varying(150) NOT NULL, "username" character varying(40) NOT NULL, "password" character varying(255) NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "role" "user"."users_role_enum" NOT NULL DEFAULT 'USER', "avatar" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "users_email_uniq" ON "user"."users"  ("email") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "users_username_uniq" ON "user"."users"  ("username") `);
        await queryRunner.query(`CREATE TABLE "user"."user_blocks" ("id" BIGSERIAL NOT NULL, "blocker_id" bigint NOT NULL, "blocked_id" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_0bae5f5cab7574a84889462187c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "chat"."messages_type_enum" AS ENUM('TEXT')`);
        await queryRunner.query(`CREATE TABLE "chat"."messages" ("id" BIGSERIAL NOT NULL, "text" text NOT NULL, "type" "chat"."messages_type_enum" NOT NULL DEFAULT 'TEXT', "sender_id" bigint NOT NULL, "conversation_id" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "conversationId" bigint, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "messages_sender_id_idx" ON "chat"."messages"  ("sender_id") `);
        await queryRunner.query(`CREATE TYPE "chat"."conversations_type_enum" AS ENUM('DIRECT')`);
        await queryRunner.query(`CREATE TABLE "chat"."conversations" ("id" BIGSERIAL NOT NULL, "title" character varying, "picture" character varying, "identifier" character varying, "type" "chat"."conversations_type_enum" NOT NULL DEFAULT 'DIRECT', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "conversations_identifier_uniq" ON "chat"."conversations"  ("identifier") `);
        await queryRunner.query(`CREATE TABLE "chat"."conversation_members" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "conversation_id" bigint NOT NULL, "last_seen_message_id" bigint, "last_message_id" bigint, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "last_message" bigint, CONSTRAINT "REL_ae81cc388649f0c1348c155c82" UNIQUE ("last_seen_message_id"), CONSTRAINT "REL_9efa90fa4b17f5d32d0ed1466f" UNIQUE ("last_message"), CONSTRAINT "PK_33146a476696a973a14d931e675" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat"."deleted_messages" ("id" BIGSERIAL NOT NULL, "user_id" bigint NOT NULL, "message_id" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7152ce9fd05f40828c9bac69654" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON TABLE "chat"."deleted_messages" IS 'messages that are deleted for users'`);
        await queryRunner.query(`CREATE TABLE "auth"."refresh_tokens" ("id" SERIAL NOT NULL, "user_id" bigint NOT NULL, "token" text NOT NULL, "identifier" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")); COMMENT ON COLUMN "auth"."refresh_tokens"."token" IS 'The hashed string of the actual token'; COMMENT ON COLUMN "auth"."refresh_tokens"."identifier" IS 'A unique id to identify the jwt. usually a uuid'`);
        await queryRunner.query(`CREATE INDEX "refresh_tokens_user_id_idx" ON "auth"."refresh_tokens"  ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "refresh_tokens_identifier_uniq" ON "auth"."refresh_tokens"  ("identifier") `);
        await queryRunner.query(`ALTER TABLE "user"."user_blocks" ADD CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf" FOREIGN KEY ("blocker_id") REFERENCES "user"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user"."user_blocks" ADD CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1" FOREIGN KEY ("blocked_id") REFERENCES "user"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "chat"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."messages" ADD CONSTRAINT "messages_sender_id_fk" FOREIGN KEY ("sender_id") REFERENCES "chat"."conversation_members"("id") ON DELETE NO ACTION ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_36340a1704b039608e34244511f" FOREIGN KEY ("conversation_id") REFERENCES "chat"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_ae81cc388649f0c1348c155c828" FOREIGN KEY ("last_seen_message_id") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."conversation_members" ADD CONSTRAINT "FK_9efa90fa4b17f5d32d0ed1466fc" FOREIGN KEY ("last_message") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."deleted_messages" ADD CONSTRAINT "FK_af4864dee9672d02ce3d5ecdfa6" FOREIGN KEY ("message_id") REFERENCES "chat"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SCHEMA IF EXISTS "auth" CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "chat" CASCADE`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "user" CASCADE`);
        await queryRunner.query(`ALTER TABLE "chat"."deleted_messages" DROP CONSTRAINT "FK_af4864dee9672d02ce3d5ecdfa6"`);
        await queryRunner.query(`ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_9efa90fa4b17f5d32d0ed1466fc"`);
        await queryRunner.query(`ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_ae81cc388649f0c1348c155c828"`);
        await queryRunner.query(`ALTER TABLE "chat"."conversation_members" DROP CONSTRAINT "FK_36340a1704b039608e34244511f"`);
        await queryRunner.query(`ALTER TABLE "chat"."messages" DROP CONSTRAINT "messages_sender_id_fk"`);
        await queryRunner.query(`ALTER TABLE "chat"."messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`);
        await queryRunner.query(`ALTER TABLE "user"."user_blocks" DROP CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1"`);
        await queryRunner.query(`ALTER TABLE "user"."user_blocks" DROP CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf"`);
        await queryRunner.query(`DROP INDEX "auth"."refresh_tokens_identifier_uniq"`);
        await queryRunner.query(`DROP INDEX "auth"."refresh_tokens_user_id_idx"`);
        await queryRunner.query(`DROP TABLE "auth"."refresh_tokens"`);
        await queryRunner.query(`COMMENT ON TABLE "chat"."deleted_messages" IS NULL`);
        await queryRunner.query(`DROP TABLE "chat"."deleted_messages"`);
        await queryRunner.query(`DROP TABLE "chat"."conversation_members"`);
        await queryRunner.query(`DROP INDEX "chat"."conversations_identifier_uniq"`);
        await queryRunner.query(`DROP TABLE "chat"."conversations"`);
        await queryRunner.query(`DROP TYPE "chat"."conversations_type_enum"`);
        await queryRunner.query(`DROP INDEX "chat"."messages_sender_id_idx"`);
        await queryRunner.query(`DROP TABLE "chat"."messages"`);
        await queryRunner.query(`DROP TYPE "chat"."messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "user"."user_blocks"`);
        await queryRunner.query(`DROP INDEX "user"."users_username_uniq"`);
        await queryRunner.query(`DROP INDEX "user"."users_email_uniq"`);
        await queryRunner.query(`DROP TABLE "user"."users"`);
        await queryRunner.query(`DROP TYPE "user"."users_role_enum"`);
    }

}
