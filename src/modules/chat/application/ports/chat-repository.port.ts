import { GetUserConversationIdsOptions } from '@chat/application/ports/options/get-user-conversation-ids.options';
import { Result } from '@common/result/result';
import { GetUserConversationListOptions } from '@chat/application/ports/options/get-user-conversation-list.options';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { MessageEntity } from '@chat/domain/models/message.entity';
import {
  PaginationOptions,
  PaginatedResult,
} from '@common/pagination/pagination.interface';

// Read DTOs (Primitive Data Structures bypassing Domain entirely)
export interface ConversationReadDto {
  id: string;
  type: string;
  identifier: string | null;
  title: string | null;
  picture: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMemberReadDto[];
  lastMessage: MessageReadDto | null;
  notSeenCount: number;
}

export interface ConversationMemberReadDto {
  id: string;
  userId: string;
  lastSeenMessageId: string | null;
  lastMessageId: string | null;
}

export interface MessageReadDto {
  id: string;
  text: string;
  type: string;
  senderId: string;
  createdAt: string;
}

export interface ChatQueryRepositoryPort {
  getUserConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Result<ConversationReadDto>>;

  conversationExists(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>>;

  getUserConversationList(
    userId: string,
    options: GetUserConversationListOptions,
  ): Promise<Result<PaginatedResult<ConversationReadDto>>>;

  getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<Result<string[]>>;

  getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<Result<PaginatedResult<MessageReadDto>>>;
}

export interface ChatCommandRepositoryPort {
  saveConversation(
    conversation: ConversationEntity,
  ): Promise<Result<ConversationEntity>>;
  saveMessage(message: MessageEntity): Promise<Result<MessageEntity>>;
  deleteConversation(id: string): Promise<Result<boolean>>;
}

export const CHAT_QUERY_REPOSITORY_PORT = 'chat-query-repository-port';
export const CHAT_COMMAND_REPOSITORY_PORT = 'chat-command-repository-port';
