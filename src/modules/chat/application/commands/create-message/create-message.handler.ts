import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateMessageCommand } from './create-message.command';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import {
  ChatDomainError,
  ConversationNotFoundException,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '@modules/chat/domain/chat.exceptions';

@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<
  CreateMessageCommand,
  MessageEntity
> {
  private readonly logger = new Logger(CreateMessageHandler.name);

  constructor(
    private readonly commandRepo: ConversationRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateMessageCommand): Promise<MessageEntity> {
    const {
      text,
      type,
      senderId,
      conversationId,
      deletedForUserIds,
      replyToMessageId,
    } = command;

    const conversation =
      await this.commandRepo.getConversationById(conversationId);
    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    const member = conversation.members.find((m) => m.userId === senderId);
    if (!member) {
      throw new NotMessageOwnerException(
        'User is not a member of the conversation',
      );
    }

    let replyMessage: MessageEntity | null = null;
    if (replyToMessageId) {
      replyMessage = await this.commandRepo.getMessageById(replyToMessageId);
      if (!replyMessage) {
        throw new MessageNotFoundException('Replied message not found');
      }

      if (replyMessage.conversationId !== conversationId) {
        throw new ChatDomainError(
          'Replied message does not belong to this conversation',
        );
      }

      if (replyMessage.deletedAt) {
        throw new ChatDomainError('Cannot reply to a deleted message');
      }

      if (replyMessage.deletedForUserIds.includes(senderId)) {
        throw new MessageNotFoundException('Replied message not found');
      }
    }

    const message = this.publisher.mergeObjectContext(
      MessageEntity.create(
        text,
        type,
        member.id,
        conversationId,
        deletedForUserIds,
        replyToMessageId,
      ),
    );

    const savedMessage = await this.commandRepo.saveMessage(message);
    if (replyMessage) {
      savedMessage.loadReplyToMessage(replyMessage);
    }

    message.commit();

    this.logger.log(`Created message: ${savedMessage.id}`);

    return savedMessage;
  }
}
