import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from '@application/chat/database/postgres/entities/conversation.entity';
import { MessageEntity } from '@application/chat/database/postgres/entities/message.entity';
import { CHAT_DATABASE_PROVIDER } from '@application/chat/database/providers/chat-database.provider';
import { ChatPostgresService } from '@application/chat/database/postgres/services/chat-postgres.service';

@Module({
  imports: [
    DatabaseModule.register(DatabaseType.POSTGRES),
    TypeOrmModule.forFeature(
      [ConversationEntity, MessageEntity],
      DatabaseType.POSTGRES,
    ),
  ],
  providers: [
    {
      provide: CHAT_DATABASE_PROVIDER,
      useClass: ChatPostgresService,
    },
  ],
  exports: [CHAT_DATABASE_PROVIDER],
})
export class ChatDatabaseModule {}
