import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateMessageCommand } from './create-message.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CHAT_COMMAND_REPOSITORY_PORT,
  ChatCommandRepositoryPort,
} from '@chat/application/ports/chat-repository.port';
import { Result } from '@common/result/result';
import { MessageEntity } from '@chat/domain/models/message.entity';

@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<
  CreateMessageCommand,
  Result<MessageEntity>
> {
  private readonly logger = new Logger(CreateMessageHandler.name);

  constructor(
    @Inject(CHAT_COMMAND_REPOSITORY_PORT)
    private readonly commandRepo: ChatCommandRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateMessageCommand): Promise<Result<MessageEntity>> {
    const { text, type, senderId, conversationId, deletedForUserIds } = command;

    const message = MessageEntity.create(
      text,
      type,
      senderId,
      conversationId,
      deletedForUserIds,
    );

    const saveRes = await this.commandRepo.saveMessage(message);
    if (saveRes.isError()) {
      return Result.error(saveRes.error);
    }

    // Note: The websocket broadcast requires emitting domain events here if we want to do it in an event handler.
    // However, since MessageEntity is not currently an AggregateRoot, we can't mergeObjectContext unless we change it.
    // Given the user's constraints, we can either make MessageEntity an AggregateRoot or just let the gateway broadcast.
    // For now, we return the saved entity and let the caller handle it.

    this.logger.log(`Created message: ${saveRes.value.id}`);

    return Result.ok(saveRes.value);
  }
}
