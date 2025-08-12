import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CHAT_DATABASE_PROVIDER,
  ChatDatabaseProvider,
} from '@chat/database/providers/chat-database.provider';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(CHAT_DATABASE_PROVIDER)
    private readonly chatDatabaseProvider: ChatDatabaseProvider,
  ) {}

  @TryCatch
  async getUserConversationIds(userId: string): Promise<Result<string[]>> {
    this.logger.debug(`Fetching conversation IDs for user ${userId}`);

    const res = await this.chatDatabaseProvider.getUserConversationIds(
      userId,
      {},
    );
    if (res.isError()) {
      return Result.error(res.error);
    }

    this.logger.debug(
      `Fetched ${res.value.length} conversation IDs for user ${userId}`,
    );

    return Result.ok(res.value);
  }
}
