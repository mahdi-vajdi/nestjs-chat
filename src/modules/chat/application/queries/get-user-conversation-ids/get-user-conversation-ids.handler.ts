import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationIdsQuery } from './get-user-conversation-ids.query';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';

@QueryHandler(GetUserConversationIdsQuery)
export class GetUserConversationIdsHandler implements IQueryHandler<
  GetUserConversationIdsQuery,
  string[]
> {
  private readonly logger = new Logger(GetUserConversationIdsHandler.name);

  constructor(private readonly queryRepo: ConversationReadRepositoryPort) {}

  async execute(query: GetUserConversationIdsQuery): Promise<string[]> {
    const { userId, options } = query;

    this.logger.debug(`Fetching conversation IDs for user ${userId}`);

    const conversationIds = await this.queryRepo.getUserConversationIds(
      userId,
      options,
    );

    return conversationIds;
  }
}
