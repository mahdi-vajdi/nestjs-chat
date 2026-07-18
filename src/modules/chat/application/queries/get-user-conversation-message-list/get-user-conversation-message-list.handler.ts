import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationMessageListQuery } from './get-user-conversation-message-list.query';
import { Inject, Logger } from '@nestjs/common';
import {
  CHAT_QUERY_REPOSITORY_PORT,
  ChatQueryRepositoryPort,
  MessageReadDto,
} from '@chat/application/ports/chat-repository.port';
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

  constructor(
    @Inject(CHAT_QUERY_REPOSITORY_PORT)
    private readonly queryRepo: ChatQueryRepositoryPort,
  ) {}

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
