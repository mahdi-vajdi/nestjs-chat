import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteConversationCommand } from './delete-conversation.command';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';

@CommandHandler(DeleteConversationCommand)
export class DeleteConversationHandler implements ICommandHandler<
  DeleteConversationCommand,
  boolean
> {
  private readonly logger = new Logger(DeleteConversationHandler.name);

  constructor(private readonly commandRepo: ConversationRepositoryPort) {}

  async execute(command: DeleteConversationCommand): Promise<boolean> {
    const { conversationId } = command;

    this.logger.debug(`Deleting conversation ${conversationId}`);

    const isDeleted = await this.commandRepo.deleteConversation(conversationId);

    this.logger.log(`Deleted conversation: ${conversationId}`);

    return isDeleted;
  }
}
