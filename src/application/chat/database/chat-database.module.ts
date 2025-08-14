import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CHAT_DATABASE_PROVIDER } from '@chat/database/providers/chat-database.provider';
import { ChatPostgresService } from '@chat/database/postgres/services/chat-postgres.service';
import { Message } from '@chat/database/postgres/entities/message.entity';
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';
import { ConversationMember } from '@chat/database/postgres/entities/conversation-member.entity';

@Module({
  imports: [
    DatabaseModule.register(DatabaseType.POSTGRES),
    TypeOrmModule.forFeature(
      [Conversation, Message, ConversationMember],
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
