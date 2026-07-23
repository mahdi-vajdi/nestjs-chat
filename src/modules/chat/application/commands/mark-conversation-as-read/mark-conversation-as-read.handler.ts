import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { MarkConversationAsReadCommand } from './mark-conversation-as-read.command';
import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';
import { ConversationNotFoundException } from '@chat/domain/chat.exceptions';

@CommandHandler(MarkConversationAsReadCommand)
export class MarkConversationAsReadCommandHandler implements ICommandHandler<MarkConversationAsReadCommand> {
  constructor(
    private readonly chatCommandRepository: ConversationRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: MarkConversationAsReadCommand): Promise<void> {
    const { conversationId, userId, messageId } = command;

    const conversationEntity =
      await this.chatCommandRepository.getConversationById(conversationId);

    if (!conversationEntity) {
      throw new ConversationNotFoundException();
    }

    const conversation = this.publisher.mergeObjectContext(conversationEntity);

    // Update the aggregate state
    conversation.markAsRead(userId, messageId);

    // Save changes
    await this.chatCommandRepository.saveConversation(conversation);

    // Commit events (if any)
    conversation.commit();
  }
}
