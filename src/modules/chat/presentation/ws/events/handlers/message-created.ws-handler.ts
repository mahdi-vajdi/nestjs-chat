import { EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { MessageCreatedDomainEvent } from '@modules/chat/contracts/events';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { Logger } from '@nestjs/common';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import { GetUserConversationQuery } from '@modules/chat/application/queries/get-user-conversation/get-user-conversation.query';
import {
  UserMessageCreated,
  UserMessageCreatedEvent,
} from '@modules/chat/presentation/ws/events/message-created.event';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';

@EventsHandler(MessageCreatedDomainEvent)
export class MessageCreatedWsEventHandler implements IEventHandler<MessageCreatedDomainEvent> {
  private readonly logger = new Logger(MessageCreatedWsEventHandler.name);

  constructor(
    private readonly chatWsGateway: ChatWsGateway,
    private readonly userIntegrationPort: UserIntegrationPort,
    private readonly queryBus: QueryBus,
    private readonly commandRepo: ConversationRepositoryPort,
  ) {}

  async handle(event: MessageCreatedDomainEvent) {
    this.logger.debug(
      `Handling MessageCreatedDomainEvent for message ${event.messageId}`,
    );

    // Get conversation to find target users
    let conversationDto;
    let senderUserId: string;

    try {
      const convEntity = await this.commandRepo.getConversationById(
        event.conversationId,
      );
      const senderMember = convEntity.members.find(
        (m) => m.id === event.senderId,
      );
      if (!senderMember) throw new Error('Sender member not found');
      senderUserId = senderMember.userId;

      conversationDto = await this.queryBus.execute(
        new GetUserConversationQuery(event.conversationId, senderUserId),
      );
    } catch {
      this.logger.error(
        `Could not find conversation for message ${event.messageId}`,
      );
      return;
    }

    const targetMember = conversationDto.members.find(
      (member) => member.userId !== senderUserId,
    );

    if (!targetMember) {
      this.logger.error(
        `No target member found in conversation ${conversationDto.id}`,
      );
      return;
    }

    try {
      const [currentUser, targetUser] = await Promise.all([
        this.userIntegrationPort.getUserById(senderUserId),
        this.userIntegrationPort.getUserById(targetMember.userId),
      ]);

      let rooms = [`user-${targetUser.id}`];
      rooms = rooms.filter((x) => !event.deletedForUserIds.includes(x));

      await this.chatWsGateway.serverBroadcast<UserMessageCreated>(
        this.chatWsGateway.server,
        rooms,
        new UserMessageCreatedEvent({
          id: event.messageId,
          seen: false,
          createdAt: event.createdAt.toISOString(),
          user: {
            id: currentUser.id,
            username: currentUser.username,
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            avatar: currentUser.avatar,
          },
          content: event.text,
          conversation: {
            id: conversationDto.id,
            name: conversationDto.id,
            avatar: conversationDto.picture,
            username: conversationDto.identifier,
          },
        }),
      );
    } catch {
      this.logger.error(`Could not fetch users for message broadcast`);
    }
  }
}
