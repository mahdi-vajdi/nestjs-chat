import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationQuery } from './get-user-conversation.query';
import { Inject, Logger } from '@nestjs/common';
import {
  CHAT_QUERY_REPOSITORY_PORT,
  ChatQueryRepositoryPort,
  ConversationReadDto,
} from '@chat/application/ports/chat-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetUserConversationQuery)
export class GetUserConversationHandler implements IQueryHandler<
  GetUserConversationQuery,
  Result<ConversationReadDto>
> {
  private readonly logger = new Logger(GetUserConversationHandler.name);

  constructor(
    @Inject(CHAT_QUERY_REPOSITORY_PORT)
    private readonly queryRepo: ChatQueryRepositoryPort,
  ) {}

  async execute(
    query: GetUserConversationQuery,
  ): Promise<Result<ConversationReadDto>> {
    const { conversationId, userId } = query;

    this.logger.debug(
      `Fetching conversation ${conversationId} for user ${userId}`,
    );

    const conversationRes = await this.queryRepo.getUserConversationById(
      conversationId,
      userId,
    );
    if (conversationRes.isError()) {
      return Result.error(conversationRes.error);
    }

    return Result.ok(conversationRes.value);
  }
}
