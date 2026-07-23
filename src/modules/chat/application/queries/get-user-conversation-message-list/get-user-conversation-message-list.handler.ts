import { MessageReadDto } from '@modules/chat/application/dtos/message-read.dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserConversationMessageListQuery } from './get-user-conversation-message-list.query';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { PaginatedResult } from '@common/pagination/pagination.interface';

@QueryHandler(GetUserConversationMessageListQuery)
export class GetUserConversationMessageListHandler implements IQueryHandler<
  GetUserConversationMessageListQuery,
  PaginatedResult<MessageReadDto>
> {
  private readonly logger = new Logger(
    GetUserConversationMessageListHandler.name,
  );

  constructor(private readonly queryRepo: ConversationReadRepositoryPort) {}

  async execute(
    query: GetUserConversationMessageListQuery,
  ): Promise<PaginatedResult<MessageReadDto>> {
    const { conversationId, userId, pagination } = query;

    this.logger.debug(
      `Fetching messages for conversation ${conversationId} for user ${userId}`,
    );

    const messageList = await this.queryRepo.getUserConversationMessageList(
      conversationId,
      userId,
      pagination,
    );

    return messageList;
  }
}
