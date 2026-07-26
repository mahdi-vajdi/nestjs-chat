import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateDirectConversationCommand } from './create-direct-conversation.command';
import { Logger } from '@nestjs/common';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import {
  BlockedUserException,
  ConversationAlreadyExistsException,
  TargetUserNotFoundException,
} from '@modules/chat/domain/chat.exceptions';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';

@CommandHandler(CreateDirectConversationCommand)
export class CreateDirectConversationHandler implements ICommandHandler<
  CreateDirectConversationCommand,
  ConversationEntity
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
  ): Promise<ConversationEntity> {
    const { userId, targetUserId } = command;

    const userExists =
      await this.userIntegrationPort.doesUserExist(targetUserId);
    if (!userExists) {
      throw new TargetUserNotFoundException();
    }

    const isBlocked = await this.userIntegrationPort.hasBlockRelation(
      userId,
      targetUserId,
    );
    if (isBlocked) {
      throw new BlockedUserException();
    }

    const conversationExists = await this.queryRepo.conversationExists(
      userId,
      targetUserId,
    );
    if (conversationExists) {
      this.logger.log(
        `User ${userId} already has a direct conversation with ${targetUserId}. returning error.`,
      );
      throw new ConversationAlreadyExistsException();
    }

    this.logger.debug(
      `Creating direct conversation for users ${userId} and ${targetUserId}`,
    );

    const conversation = ConversationEntity.createDirect(userId, targetUserId);

    const savedConversation =
      await this.commandRepo.saveConversation(conversation);

    const conversationRoot =
      this.publisher.mergeObjectContext(savedConversation);
    conversationRoot.commit();

    this.logger.log(`Created direct conversation: ${conversationRoot.id}`);

    return conversationRoot;
  }
}
