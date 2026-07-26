import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateMessageCommand } from './create-message.command';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { WsException } from '@nestjs/websockets';

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
    const { text, type, senderId, conversationId, deletedForUserIds } = command;

    const conversation =
      await this.commandRepo.getConversationById(conversationId);
    if (!conversation) {
      throw new WsException('Conversation not found');
    }

    const member = conversation.members.find((m) => m.userId === senderId);
    if (!member) {
      throw new WsException('User is not a member of the conversation');
    }

    const message = this.publisher.mergeObjectContext(
      MessageEntity.create(
        text,
        type,
        member.id,
        conversationId,
        deletedForUserIds,
      ),
    );

    const savedMessage = await this.commandRepo.saveMessage(message);

    message.commit();

    this.logger.log(`Created message: ${savedMessage.id}`);

    return savedMessage;
  }
}
