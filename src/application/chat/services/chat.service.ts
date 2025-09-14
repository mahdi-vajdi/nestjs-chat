import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CHAT_DATABASE_PROVIDER,
  ChatDatabaseProvider,
} from '@chat/database/providers/chat-database.provider';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import {
  PaginatedResult,
  PaginationOptions,
} from '@common/pagination/pagination.interface';
import { inspect } from 'node:util';
import { ConversationEntity } from '@chat/models/conversation.model';
import { PaginationHelper } from '@common/pagination/pagination.helper';
import { ConversationType } from '@chat/enums/conversation-type.enum';
import { ErrorCode } from '@common/result/error';
import { MessageEntity, MessageProps } from '@chat/models/message.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(CHAT_DATABASE_PROVIDER)
    private readonly chatDatabaseProvider: ChatDatabaseProvider,
  ) {}

  @TryCatch
  async createDirectConversation(
    userId: string,
    targetUserId: string,
  ): Promise<Result<ConversationEntity>> {
    const conversationExistsRes =
      await this.chatDatabaseProvider.conversationExists(userId, targetUserId);
    if (conversationExistsRes.isError()) {
      return Result.error(conversationExistsRes.error);
    }
    if (conversationExistsRes.value) {
      this.logger.log(
        `User ${userId} already has a direct conversation with ${targetUserId}. returning error.`,
      );
      return Result.error(
        'Conversation already exists.',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    this.logger.debug(
      `Creating direct conversation for users ${userId} and ${targetUserId}`,
    );
    const createConversationRes =
      await this.chatDatabaseProvider.createDirectConversation(
        userId,
        targetUserId,
      );
    if (createConversationRes.isError()) {
      return Result.error(createConversationRes.error);
    }

    this.logger.log(
      `Created direct conversation: ${createConversationRes.value.id}`,
    );

    return Result.ok(createConversationRes.value);
  }

  @TryCatch
  async deleteConversation(id: string): Promise<Result<boolean>> {
    const res = await this.chatDatabaseProvider.deleteConversation(id);
    if (res.isError()) {
      return Result.error(res.error);
    }

    return Result.ok(res.value);
  }

  @TryCatch
  async createMessage(props: MessageProps): Promise<Result<MessageEntity>> {
    this.logger.error(`Creating message: ${inspect(props)}`);
    const res = await this.chatDatabaseProvider.createMessage(props);
    if (res.isError()) {
      return Result.error(res.error);
    }

    this.logger.log(`Created message: ${res.value.id}`);
    return Result.ok(res.value);
  }

  @TryCatch
  async getUserConversationList(
    userId: string,
    pagination: PaginationOptions,
    filteredUserIds?: string[],
  ): Promise<Result<PaginatedResult<ConversationEntity>>> {
    this.logger.debug(
      `Fetching conversations for user ${userId}. pagination: ${inspect(pagination)}`,
    );
    const conversationListRes =
      await this.chatDatabaseProvider.getUserConversationList(userId, {
        pagination: pagination,
        filterUserIds: filteredUserIds,
        withLastMessage: true,
      });
    if (conversationListRes.isError()) {
      return Result.error(conversationListRes.error);
    }

    // Get the not seen message count for user's each conversation
    const notSeenCountsRes =
      await this.chatDatabaseProvider.getConversationsNotSeenCounts(
        userId,
        conversationListRes.value[0].map((c) => c.id),
      );
    if (notSeenCountsRes.isError()) {
      return Result.error(notSeenCountsRes.error);
    }

    // Get the target conversation member for direct conversations
    const directConversationIds = conversationListRes.value[0]
      .filter((c) => (c.type = ConversationType.DIRECT))
      .map((c) => c.id);
    const directConversationMembersRes =
      await this.chatDatabaseProvider.getConversationMembers(
        directConversationIds,
        { excludeUserId: userId },
      );
    if (directConversationMembersRes.isError()) {
      return Result.error(directConversationMembersRes.error);
    }

    for (const conversation of conversationListRes.value[0]) {
      // Find and assign the last message for the conversation
      // We use the last message from each conversation member because it's more efficient
      conversation.lastMessage = conversation.members
        .map((member) => member.lastMessage)
        .reduce((latest, message) =>
          message.createdAt > latest.createdAt ? message : latest,
        );

      // Assign the user's not seen count for the conversation
      const currentMemberIndex = conversation.members.findIndex(
        (m) => m.id == userId,
      );
      if (!currentMemberIndex) {
        continue;
      }
      conversation.members[currentMemberIndex].notSeenCount =
        notSeenCountsRes.value[conversation.id] ?? 0;

      if (conversation.type === ConversationType.DIRECT) {
        // Add the other conversation member
        const otherMember = directConversationMembersRes.value.find(
          (cm) => cm.conversation.id === conversation.id,
        );
        if (!otherMember) {
          continue;
        }
        if (Array.isArray(conversation.members)) {
          conversation.members.push(otherMember);
        } else {
          conversation.members = [otherMember];
        }
      }
    }

    this.logger.log(
      `Fetched ${conversationListRes.value[0].length} conversations for user ${userId}`,
    );
    return Result.ok(
      PaginationHelper.createResult(
        conversationListRes[0],
        conversationListRes[1],
        pagination,
      ),
    );
  }

  @TryCatch
  async getUserConversationIds(userId: string): Promise<Result<string[]>> {
    this.logger.debug(`Fetching conversation IDs for user ${userId}`);

    const res = await this.chatDatabaseProvider.getUserConversationIds(
      userId,
      {},
    );
    if (res.isError()) {
      return Result.error(res.error);
    }

    this.logger.debug(
      `Fetched ${res.value.length} conversation IDs for user ${userId}`,
    );
    return Result.ok(res.value);
  }

  @TryCatch
  async getUserConversation(
    conversationId: string,
    userId: string,
  ): Promise<Result<ConversationEntity>> {
    const res = await this.chatDatabaseProvider.getUserConversationById(
      conversationId,
      userId,
    );
    if (res.isError()) {
      return Result.error(res.error);
    }

    this.logger.debug(
      `Fetched conversation ${conversationId} for user ${userId}`,
    );
    return Result.ok(res.value);
  }

  @TryCatch
  async getUserConversationMessageList(
    conversationId: string,
    userId: string,
    pagination: PaginationOptions,
  ): Promise<Result<PaginatedResult<MessageEntity>>> {
    const res = await this.chatDatabaseProvider.getUserConversationMessageList(
      conversationId,
      userId,
      pagination,
    );
    if (res.isError()) {
      return Result.error(res.error);
    }

    return Result.ok(
      PaginationHelper.createResult(res.value[0], res.value[1], pagination),
    );
  }
}
