import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';
import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationReadRepositoryPort } from '@chat/application/ports/conversation-read-repository.port';
import { ConversationPostgresRepository } from '@chat/infrastructure/database/repositories/conversation-postgres.repository';
import { ConversationPostgresReadRepository } from '@chat/infrastructure/database/repositories/conversation-postgres-read.repository';
import { Message } from '@chat/infrastructure/database/entities/message.entity';
import { Conversation } from '@chat/infrastructure/database/entities/conversation.entity';
import { ConversationMember } from '@chat/infrastructure/database/entities/conversation-member.entity';
import { DeletedMessage } from '@chat/infrastructure/database/entities/deleted-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Conversation, Message, ConversationMember, DeletedMessage],
      DatabaseType.POSTGRES,
    ),
  ],
  providers: [
    {
      provide: ConversationRepositoryPort,
      useClass: ConversationPostgresRepository,
    },
    {
      provide: ConversationReadRepositoryPort,
      useClass: ConversationPostgresReadRepository,
    },
  ],
  exports: [ConversationRepositoryPort, ConversationReadRepositoryPort],
})
export class ChatDatabaseModule {}
