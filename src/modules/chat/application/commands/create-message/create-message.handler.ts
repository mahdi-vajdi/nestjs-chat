import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateMessageCommand } from './create-message.command';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';

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

    const message = this.publisher.mergeObjectContext(
      MessageEntity.create(
        text,
        type,
        senderId,
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
