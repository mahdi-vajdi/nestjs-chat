import { GetUserConversationIdsOptions } from '@chat/database/options/get-user-conversation-ids.options';
import { Result } from '@common/result/result';
import { GetUserConversationListOptions } from '@chat/database/options/get-user-conversation-list.options';
import { ConversationEntity } from '@chat/models/conversation.model';
import { ConversationMemberEntity } from '@chat/models/conversation-member.model';
import { GetConversationMembersOptions } from '@chat/database/options/get-conversation-members.options';
import { MessageEntity, MessageProps } from '@chat/models/message.entity';

export interface ChatDatabaseReader {
  conversationExists(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>>;

  getUserConversationList(
    userId: string,
    options: GetUserConversationListOptions,
  ): Promise<Result<[ConversationEntity[], number]>>;

  getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<Result<string[]>>;

  getConversationsNotSeenCounts(
    userId: string,
    conversationIds: string[],
  ): Promise<Result<Record<string, number>>>;

  getConversationMembers(
    conversationIds: string[],
    options: GetConversationMembersOptions,
  ): Promise<Result<ConversationMemberEntity[]>>;
}

export interface ChatDatabaseWriter {
  createDirectConversation(
    userId: string,
    targetUserId: string,
  ): Promise<Result<ConversationEntity>>;

  deleteConversation(id: string): Promise<Result<boolean>>;

  createMessage(props: MessageProps): Promise<Result<MessageEntity>>;
}

export interface ChatDatabaseProvider
  extends ChatDatabaseReader,
    ChatDatabaseWriter {}

export const CHAT_DATABASE_PROVIDER = 'chat-database-provider';
