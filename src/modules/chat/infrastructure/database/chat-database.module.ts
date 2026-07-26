import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { ConversationPostgresRepository } from '@modules/chat/infrastructure/database/postgres/repositories/conversation-postgres.repository';
import { ConversationPostgresReadRepository } from '@modules/chat/infrastructure/database/postgres/repositories/conversation-postgres-read.repository';
import { Message } from '@modules/chat/infrastructure/database/postgres/entities/message.entity';
import { Conversation } from '@modules/chat/infrastructure/database/postgres/entities/conversation.entity';
import { ConversationMember } from '@modules/chat/infrastructure/database/postgres/entities/conversation-member.entity';
import { DeletedMessage } from '@modules/chat/infrastructure/database/postgres/entities/deleted-message.entity';

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
