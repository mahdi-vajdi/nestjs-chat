import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteConversationCommand } from './delete-conversation.command';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';
import { Result } from '@common/result/result';

@CommandHandler(DeleteConversationCommand)
export class DeleteConversationHandler implements ICommandHandler<
  DeleteConversationCommand,
  Result<boolean>
> {
  private readonly logger = new Logger(DeleteConversationHandler.name);

  constructor(private readonly commandRepo: ConversationRepositoryPort) {}

  async execute(command: DeleteConversationCommand): Promise<Result<boolean>> {
    const { conversationId } = command;

    this.logger.debug(`Deleting conversation ${conversationId}`);

    const deleteRes = await this.commandRepo.deleteConversation(conversationId);
    if (deleteRes.isError()) {
      return Result.error(deleteRes.error);
    }

    this.logger.log(`Deleted conversation: ${conversationId}`);

    return Result.ok(deleteRes.value);
  }
}
