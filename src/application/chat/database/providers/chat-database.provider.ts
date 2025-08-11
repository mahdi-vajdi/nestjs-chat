export interface ChatDatabaseReader {}

export interface ChatDatabaseWriter {}

export interface ChatDatabaseProvider
  extends ChatDatabaseReader,
    ChatDatabaseWriter {}

export const CHAT_DATABASE_PROVIDER = 'chat-database-provider';
