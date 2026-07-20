import { MessageReadDto } from '@chat/application/dtos/message-read.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationMessageListQuery } from './get-user-conversation-message-list.query';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@chat/application/ports/conversation-read-repository.port';
import { Result } from '@common/result/result';
import { PaginatedResult } from '@common/pagination/pagination.interface';

@QueryHandler(GetUserConversationMessageListQuery)
export class GetUserConversationMessageListHandler implements IQueryHandler<
  GetUserConversationMessageListQuery,
  Result<PaginatedResult<MessageReadDto>>
> {
  private readonly logger = new Logger(
    GetUserConversationMessageListHandler.name,
  );

  constructor(private readonly queryRepo: ConversationReadRepositoryPort) {}

  async execute(
    query: GetUserConversationMessageListQuery,
  ): Promise<Result<PaginatedResult<MessageReadDto>>> {
    const { conversationId, userId, pagination } = query;

    this.logger.debug(
      `Fetching messages for conversation ${conversationId} for user ${userId}`,
    );

    const messageListRes = await this.queryRepo.getUserConversationMessageList(
      conversationId,
      userId,
      pagination,
    );
    if (messageListRes.isError()) {
      return Result.error(messageListRes.error);
    }

    return Result.ok(messageListRes.value);
  }
}
