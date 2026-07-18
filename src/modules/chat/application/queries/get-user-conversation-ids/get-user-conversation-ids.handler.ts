import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationIdsQuery } from './get-user-conversation-ids.query';
import { Inject, Logger } from '@nestjs/common';
import {
  CHAT_QUERY_REPOSITORY_PORT,
  ChatQueryRepositoryPort,
} from '@chat/application/ports/chat-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetUserConversationIdsQuery)
export class GetUserConversationIdsHandler implements IQueryHandler<
  GetUserConversationIdsQuery,
  Result<string[]>
> {
  private readonly logger = new Logger(GetUserConversationIdsHandler.name);

  constructor(
    @Inject(CHAT_QUERY_REPOSITORY_PORT)
    private readonly queryRepo: ChatQueryRepositoryPort,
  ) {}

  async execute(query: GetUserConversationIdsQuery): Promise<Result<string[]>> {
    const { userId, options } = query;

    this.logger.debug(`Fetching conversation IDs for user ${userId}`);

    const conversationIdsRes = await this.queryRepo.getUserConversationIds(
      userId,
      options,
    );
    if (conversationIdsRes.isError()) {
      return Result.error(conversationIdsRes.error);
    }

    return Result.ok(conversationIdsRes.value);
  }
}
