import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Message } from '@chat/database/postgres/entities/message.entity';
import { ChatDatabaseProvider } from '@chat/database/providers/chat-database.provider';
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';

@Injectable()
export class ChatPostgresService implements ChatDatabaseProvider {
  constructor(
    @InjectRepository(Conversation, DatabaseType.POSTGRES)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message, DatabaseType.POSTGRES)
    private readonly messageRepository: Repository<Message>,
  ) {}
}
