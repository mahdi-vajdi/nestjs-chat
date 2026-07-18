import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CHAT_COMMAND_REPOSITORY_PORT,
  CHAT_QUERY_REPOSITORY_PORT,
} from '@chat/application/ports/chat-repository.port';
import { ChatCommandPostgresRepository } from '@chat/infrastructure/postgres/repositories/chat-command-postgres.repository';
import { ChatQueryPostgresRepository } from '@chat/infrastructure/postgres/repositories/chat-query-postgres.repository';
import { Message } from '@chat/infrastructure/postgres/entities/message.entity';
import { Conversation } from '@chat/infrastructure/postgres/entities/conversation.entity';
import { ConversationMember } from '@chat/infrastructure/postgres/entities/conversation-member.entity';
import { DeletedMessage } from '@chat/infrastructure/postgres/entities/deleted-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Conversation, Message, ConversationMember, DeletedMessage],
      DatabaseType.POSTGRES,
    ),
  ],
  providers: [
    {
      provide: CHAT_COMMAND_REPOSITORY_PORT,
      useClass: ChatCommandPostgresRepository,
    },
    {
      provide: CHAT_QUERY_REPOSITORY_PORT,
      useClass: ChatQueryPostgresRepository,
    },
  ],
  exports: [CHAT_COMMAND_REPOSITORY_PORT, CHAT_QUERY_REPOSITORY_PORT],
})
export class ChatDatabaseModule {}
