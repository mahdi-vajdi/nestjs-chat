import { GetUserConversationIdsOptions } from '@chat/application/ports/options/get-user-conversation-ids.options';
import { GetUserConversationListOptions } from '@chat/application/ports/options/get-user-conversation-list.options';
import {
  PaginatedResult,
  PaginationOptions,
} from '@common/pagination/pagination.interface';
import { ConversationReadDto } from '@chat/application/dtos/conversation-read.dto';
import { MessageReadDto } from '@chat/application/dtos/message-read.dto';

export abstract class ConversationReadRepositoryPort {
  abstract getUserConversationById(
    conversationId: string,
    userId: string,
  ): Promise<ConversationReadDto | null>;

  abstract conversationExists(
    userId: string,
    targetUserId: string,
  ): Promise<boolean>;

  abstract getUserConversationList(
    userId: string,
    options: GetUserConversationListOptions,
  ): Promise<PaginatedResult<ConversationReadDto>>;

  abstract getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<string[]>;

  abstract getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<MessageReadDto>>;
}
