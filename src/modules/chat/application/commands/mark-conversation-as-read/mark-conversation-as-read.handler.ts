import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { MarkConversationAsReadCommand } from './mark-conversation-as-read.command';
import {
  CHAT_COMMAND_REPOSITORY_PORT,
  ChatCommandRepositoryPort,
} from '@chat/application/ports/chat-repository.port';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { TryCatch } from '@common/decorators/try-catch.decorator';

@CommandHandler(MarkConversationAsReadCommand)
export class MarkConversationAsReadCommandHandler implements ICommandHandler<MarkConversationAsReadCommand> {
  constructor(
    @Inject(CHAT_COMMAND_REPOSITORY_PORT)
    private readonly chatCommandRepository: ChatCommandRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  @TryCatch
  async execute(command: MarkConversationAsReadCommand): Promise<Result<void>> {
    const { conversationId, userId, messageId } = command;

    const conversationResult =
      await this.chatCommandRepository.getConversationById(conversationId);

    if (conversationResult.isError() || !conversationResult.value) {
      return Result.error('Conversation not found', ErrorCode.NOT_FOUND);
    }

    const conversation = this.publisher.mergeObjectContext(
      conversationResult.value,
    );

    // Update the aggregate state
    conversation.markAsRead(userId, messageId);

    // Save changes
    await this.chatCommandRepository.saveConversation(conversation);

    // Commit events (if any)
    conversation.commit();

    return Result.ok(null);
  }
}
