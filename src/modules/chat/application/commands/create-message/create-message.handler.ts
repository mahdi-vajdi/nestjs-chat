import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateMessageCommand } from './create-message.command';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';
import { Result } from '@common/result/result';
import { MessageEntity } from '@chat/domain/models/message.entity';

@CommandHandler(CreateMessageCommand)
export class CreateMessageHandler implements ICommandHandler<
  CreateMessageCommand,
  Result<MessageEntity>
> {
  private readonly logger = new Logger(CreateMessageHandler.name);

  constructor(
    private readonly commandRepo: ConversationRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateMessageCommand): Promise<Result<MessageEntity>> {
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

    const saveRes = await this.commandRepo.saveMessage(message);
    if (saveRes.isError()) {
      return Result.error(saveRes.error);
    }

    message.commit();

    this.logger.log(`Created message: ${saveRes.value.id}`);

    return Result.ok(saveRes.value);
  }
}
