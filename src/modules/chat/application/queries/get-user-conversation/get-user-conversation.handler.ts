import { ConversationReadDto } from '@modules/chat/application/dtos/conversation-read.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationQuery } from './get-user-conversation.query';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { ConversationNotFoundException } from '@modules/chat/domain/chat.exceptions';

@QueryHandler(GetUserConversationQuery)
export class GetUserConversationHandler implements IQueryHandler<
  GetUserConversationQuery,
  ConversationReadDto
> {
  private readonly logger = new Logger(GetUserConversationHandler.name);

  constructor(private readonly queryRepo: ConversationReadRepositoryPort) {}

  async execute(query: GetUserConversationQuery): Promise<ConversationReadDto> {
    const { conversationId, userId } = query;

    this.logger.debug(
      `Fetching conversation ${conversationId} for user ${userId}`,
    );

    const conversation = await this.queryRepo.getUserConversationById(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    return conversation;
  }
}
