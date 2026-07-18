import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationListQuery } from './get-user-conversation-list.query';
import { Inject, Logger } from '@nestjs/common';
import {
  CHAT_QUERY_REPOSITORY_PORT,
  ChatQueryRepositoryPort,
  ConversationReadDto,
} from '@chat/application/ports/chat-repository.port';
import { Result } from '@common/result/result';
import { PaginatedResult } from '@common/pagination/pagination.interface';

@QueryHandler(GetUserConversationListQuery)
export class GetUserConversationListHandler implements IQueryHandler<
  GetUserConversationListQuery,
  Result<PaginatedResult<ConversationReadDto>>
> {
  private readonly logger = new Logger(GetUserConversationListHandler.name);

  constructor(
    @Inject(CHAT_QUERY_REPOSITORY_PORT)
    private readonly queryRepo: ChatQueryRepositoryPort,
  ) {}

  async execute(
    query: GetUserConversationListQuery,
  ): Promise<Result<PaginatedResult<ConversationReadDto>>> {
    const { userId, options } = query;

    this.logger.debug(`Fetching conversation list for user ${userId}`);

    const conversationListRes = await this.queryRepo.getUserConversationList(
      userId,
      options,
    );
    if (conversationListRes.isError()) {
      return Result.error(conversationListRes.error);
    }

    return Result.ok(conversationListRes.value);
  }
}
