import { EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { MessageCreatedDomainEvent } from '@chat/domain/events/message-created.domain-event';
import { ChatWsGateway } from '@chat/presentation/ws/chat-ws.gateway';
import { Logger } from '@nestjs/common';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { GetUserConversationQuery } from '@chat/application/queries/get-user-conversation/get-user-conversation.query';
import {
  UserMessageCreated,
  UserMessageCreatedEvent,
} from '@chat/presentation/ws/events/message-created.event';
import { ConversationRepositoryPort } from '@chat/application/ports/conversation-repository.port';

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
    let conversation;
    try {
      conversation = await this.queryBus.execute(
        new GetUserConversationQuery(event.conversationId, event.senderId),
      );
    } catch {
      this.logger.error(
        `Could not find conversation for message ${event.messageId}`,
      );
      return;
    }

    const targetMember = conversation.members.find(
      (member) => member.userId !== event.senderId,
    );

    if (!targetMember) {
      this.logger.error(
        `No target member found in conversation ${conversation.id}`,
      );
      return;
    }

    try {
      const [currentUser, targetUser] = await Promise.all([
        this.userIntegrationPort.getUserById(event.senderId),
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
            id: conversation.id,
            name: conversation.id,
            avatar: conversation.picture,
            username: conversation.identifier,
          },
        }),
      );
    } catch {
      this.logger.error(`Could not fetch users for message broadcast`);
    }
  }
}
