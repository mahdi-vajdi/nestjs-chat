import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DeleteMessageCommand } from './delete-message.command';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';
import {
  ConversationNotFoundException,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '@modules/chat/domain/chat.exceptions';

@CommandHandler(DeleteMessageCommand)
export class DeleteMessageHandler implements ICommandHandler<
  DeleteMessageCommand,
  MessageEntity
> {
  private readonly logger = new Logger(DeleteMessageHandler.name);

  constructor(
    private readonly commandRepo: ConversationRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: DeleteMessageCommand): Promise<MessageEntity> {
    const { messageId, conversationId, userId, scope } = command;

    const conversation =
      await this.commandRepo.getConversationById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    const member = conversation.members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotMessageOwnerException(
        'User is not a member of the conversation',
      );
    }

    const messageEntity = await this.commandRepo.getMessageById(messageId);
    if (!messageEntity || messageEntity.conversationId !== conversationId) {
      throw new MessageNotFoundException();
    }

    const message = this.publisher.mergeObjectContext(messageEntity);

    if (scope === MessageDeleteScope.ME) {
      message.deleteForUser(userId);
    } else {
      message.deleteForEveryone(member.id, userId);
    }

    const updatedMessage = await this.commandRepo.saveMessageDeletion(message);

    message.commit();

    this.logger.log(
      `Deleted message: ${updatedMessage.id} with scope: ${scope}`,
    );

    return updatedMessage;
  }
}
