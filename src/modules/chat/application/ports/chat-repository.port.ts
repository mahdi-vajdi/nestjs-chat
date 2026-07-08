import { GetUserConversationIdsOptions } from '@chat/application/ports/options/get-user-conversation-ids.options';
import { Result } from '@common/result/result';
import { GetUserConversationListOptions } from '@chat/application/ports/options/get-user-conversation-list.options';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';
import { GetConversationMembersOptions } from '@chat/application/ports/options/get-conversation-members.options';
import { MessageEntity, MessageProps } from '@chat/domain/models/message.entity';
import { PaginationOptions } from '@common/pagination/pagination.interface';

export interface ChatDatabaseReader {
  getUserConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Result<ConversationEntity>>;

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

  getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<Result<[MessageEntity[], number]>>;
}

export interface ChatDatabaseWriter {
  createDirectConversation(
    userId: string,
    targetUserId: string,
  ): Promise<Result<ConversationEntity>>;

  deleteConversation(id: string): Promise<Result<boolean>>;

  createMessage(props: MessageProps): Promise<Result<MessageEntity>>;
}

export interface ChatRepositoryPort
  extends ChatDatabaseReader, ChatDatabaseWriter {}

export const CHAT_REPOSITORY_PORT = 'chat-database-provider';
