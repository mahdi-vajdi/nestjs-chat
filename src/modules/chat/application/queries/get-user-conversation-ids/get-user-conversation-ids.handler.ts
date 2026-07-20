import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationIdsQuery } from './get-user-conversation-ids.query';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@chat/application/ports/conversation-read-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetUserConversationIdsQuery)
export class GetUserConversationIdsHandler implements IQueryHandler<
  GetUserConversationIdsQuery,
  Result<string[]>
> {
  private readonly logger = new Logger(GetUserConversationIdsHandler.name);

  constructor(private readonly queryRepo: ConversationReadRepositoryPort) {}

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
