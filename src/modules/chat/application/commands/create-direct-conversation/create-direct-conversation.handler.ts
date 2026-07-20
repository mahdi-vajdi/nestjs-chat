import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateDirectConversationCommand } from './create-direct-conversation.command';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@chat/application/ports/conversation-read-repository.port';
import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { Result } from '@common/result/result';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ErrorCode } from '@common/result/error';

@CommandHandler(CreateDirectConversationCommand)
export class CreateDirectConversationHandler implements ICommandHandler<
  CreateDirectConversationCommand,
  Result<ConversationEntity>
> {
  private readonly logger = new Logger(CreateDirectConversationHandler.name);

  constructor(
    private readonly commandRepo: ConversationRepositoryPort,
    private readonly queryRepo: ConversationReadRepositoryPort,
    private readonly userIntegrationPort: UserIntegrationPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(
    command: CreateDirectConversationCommand,
  ): Promise<Result<ConversationEntity>> {
    const { userId, targetUserId } = command;

    const userExistsRes =
      await this.userIntegrationPort.doesUserExist(targetUserId);
    if (userExistsRes.isError()) return Result.error(userExistsRes.error);
    if (!userExistsRes.value) {
      return Result.error('Target user does not exist', ErrorCode.NOT_FOUND);
    }

    const blockRelationRes = await this.userIntegrationPort.hasBlockRelation(
      userId,
      targetUserId,
    );
    if (blockRelationRes.isError()) return Result.error(blockRelationRes.error);
    if (blockRelationRes.value) {
      return Result.error(
        'Cannot create conversation due to a block relation',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    const conversationExistsRes = await this.queryRepo.conversationExists(
      userId,
      targetUserId,
    );
    if (conversationExistsRes.isError()) {
      return Result.error(conversationExistsRes.error);
    }
    if (conversationExistsRes.value) {
      this.logger.log(
        `User ${userId} already has a direct conversation with ${targetUserId}. returning error.`,
      );
      return Result.error(
        'Conversation already exists.',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    this.logger.debug(
      `Creating direct conversation for users ${userId} and ${targetUserId}`,
    );

    const conversation = ConversationEntity.createDirect(userId, targetUserId);

    const saveRes = await this.commandRepo.saveConversation(conversation);
    if (saveRes.isError()) {
      return Result.error(saveRes.error);
    }

    const conversationRoot = this.publisher.mergeObjectContext(saveRes.value);
    conversationRoot.commit();

    this.logger.log(`Created direct conversation: ${conversationRoot.id}`);

    return Result.ok(conversationRoot);
  }
}
