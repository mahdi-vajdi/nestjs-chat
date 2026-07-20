import { GetUserConversationIdsOptions } from '@chat/application/ports/options/get-user-conversation-ids.options';
import { Result } from '@common/result/result';
import { GetUserConversationListOptions } from '@chat/application/ports/options/get-user-conversation-list.options';
import {
  PaginationOptions,
  PaginatedResult,
} from '@common/pagination/pagination.interface';
import { ConversationReadDto } from '@chat/application/dtos/conversation-read.dto';
import { MessageReadDto } from '@chat/application/dtos/message-read.dto';

export abstract class ConversationReadRepositoryPort {
  abstract getUserConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Result<ConversationReadDto>>;

  abstract conversationExists(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>>;

  abstract getUserConversationList(
    userId: string,
    options: GetUserConversationListOptions,
  ): Promise<Result<PaginatedResult<ConversationReadDto>>>;

  abstract getUserConversationIds(
    userId: string,
    options: GetUserConversationIdsOptions,
  ): Promise<Result<string[]>>;

  abstract getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<Result<PaginatedResult<MessageReadDto>>>;
}
