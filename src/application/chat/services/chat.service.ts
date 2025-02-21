import { Inject, Injectable } from '@nestjs/common';
import {
  CHAT_DATABASE_PROVIDER,
  ChatDatabaseProvider,
} from '@chat/database/providers/chat-database.provider';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_DATABASE_PROVIDER)
    private readonly chatDatabaseProvider: ChatDatabaseProvider,
  ) {}
}
