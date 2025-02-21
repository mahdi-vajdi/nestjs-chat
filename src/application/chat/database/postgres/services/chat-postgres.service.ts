import { Injectable } from '@nestjs/common';
import { ChatDatabaseProvider } from '@application/chat/database/providers/chat-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { ConversationEntity } from '@application/chat/database/postgres/entities/conversation.entity';
import { Repository } from 'typeorm';
import { MessageEntity } from '@application/chat/database/postgres/entities/message.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';

@Injectable()
export class ChatPostgresService implements ChatDatabaseProvider {
  constructor(
    @InjectRepository(ConversationEntity, DatabaseType.POSTGRES)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity, DatabaseType.POSTGRES)
    private readonly messageRepository: Repository<MessageEntity>,
  ) {}
}
