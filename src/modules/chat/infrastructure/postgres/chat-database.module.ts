import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CHAT_REPOSITORY_PORT } from '@chat/application/ports/chat-repository.port';
import { ChatPostgresRepository } from '@chat/infrastructure/postgres/repositories/chat-postgres.repository';
import { Message } from '@chat/infrastructure/postgres/entities/message.entity';
import { Conversation } from '@chat/infrastructure/postgres/entities/conversation.entity';
import { ConversationMember } from '@chat/infrastructure/postgres/entities/conversation-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Conversation, Message, ConversationMember],
      DatabaseType.POSTGRES,
    ),
  ],
  providers: [
    {
      provide: CHAT_REPOSITORY_PORT,
      useClass: ChatPostgresRepository,
    },
  ],
  exports: [CHAT_REPOSITORY_PORT],
})
export class ChatDatabaseModule {}
