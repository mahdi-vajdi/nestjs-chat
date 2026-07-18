import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteConversationCommand } from './delete-conversation.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CHAT_COMMAND_REPOSITORY_PORT,
  ChatCommandRepositoryPort,
} from '@chat/application/ports/chat-repository.port';
import { Result } from '@common/result/result';

@CommandHandler(DeleteConversationCommand)
export class DeleteConversationHandler implements ICommandHandler<
  DeleteConversationCommand,
  Result<boolean>
> {
  private readonly logger = new Logger(DeleteConversationHandler.name);

  constructor(
    @Inject(CHAT_COMMAND_REPOSITORY_PORT)
    private readonly commandRepo: ChatCommandRepositoryPort,
  ) {}

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
