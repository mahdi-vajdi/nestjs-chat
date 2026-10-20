import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EditMessageCommand } from './edit-message.command';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import {
  ConversationNotFoundException,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '@modules/chat/domain/chat.exceptions';

@CommandHandler(EditMessageCommand)
export class EditMessageHandler implements ICommandHandler<
  EditMessageCommand,
  MessageEntity
> {
  private readonly logger = new Logger(EditMessageHandler.name);

  constructor(
    private readonly commandRepo: ConversationRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: EditMessageCommand): Promise<MessageEntity> {
    const { messageId, conversationId, userId, text } = command;

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

    message.edit(text, member.id);

    const updatedMessage = await this.commandRepo.updateMessage(message);

    message.commit();

    this.logger.log(`Edited message: ${updatedMessage.id}`);

    return updatedMessage;
  }
}
