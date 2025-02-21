import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { MessageEntity } from '@chat/database/postgres/entities/message.entity';
import { ChatDatabaseProvider } from '@chat/database/providers/chat-database.provider';
import { ConversationEntity } from '@chat/database/postgres/entities/conversation.entity';

@Injectable()
export class ChatPostgresService implements ChatDatabaseProvider {
  constructor(
    @InjectRepository(ConversationEntity, DatabaseType.POSTGRES)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity, DatabaseType.POSTGRES)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}
}
