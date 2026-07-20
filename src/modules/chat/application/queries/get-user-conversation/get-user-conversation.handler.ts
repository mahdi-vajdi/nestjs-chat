import { ConversationReadDto } from '@chat/application/dtos/conversation-read.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationQuery } from './get-user-conversation.query';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@chat/application/ports/conversation-read-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetUserConversationQuery)
export class GetUserConversationHandler implements IQueryHandler<
  GetUserConversationQuery,
  Result<ConversationReadDto>
> {
  private readonly logger = new Logger(GetUserConversationHandler.name);

  constructor(private readonly queryRepo: ConversationReadRepositoryPort) {}

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
