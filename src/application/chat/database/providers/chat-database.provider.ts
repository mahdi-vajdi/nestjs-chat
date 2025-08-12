import { GetUserConversationIdsOptions } from '@chat/database/providers/options/get-user-conversation-ids.options';
import { Result } from '@common/result/result';

export interface ChatDatabaseReader {
  getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<Result<string[]>>;
}

export interface ChatDatabaseWriter {}

export interface ChatDatabaseProvider
  extends ChatDatabaseReader,
    ChatDatabaseWriter {}

export const CHAT_DATABASE_PROVIDER = 'chat-database-provider';
