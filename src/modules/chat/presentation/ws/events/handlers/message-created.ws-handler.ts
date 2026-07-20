import { EventsHandler, IEventHandler, QueryBus } from '@nestjs/cqrs';
import { MessageCreatedDomainEvent } from '@chat/domain/events/message-created.domain-event';
import { ChatWsGateway } from '@chat/presentation/ws/chat-ws.gateway';
import { Logger } from '@nestjs/common';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { GetUserConversationQuery } from '@chat/application/queries/get-user-conversation/get-user-conversation.query';
import {
  UserMessageCreatedEvent,
  UserMessageCreated,
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
    const conversationRes = await this.queryBus.execute(
      new GetUserConversationQuery(event.conversationId, event.senderId),
    );

    if (conversationRes.isError()) {
      this.logger.error(
        `Could not find conversation for message ${event.messageId}`,
      );
      return;
    }

    const conversation = conversationRes.value;

    const targetMember = conversation.members.find(
      (member) => member.userId !== event.senderId,
    );

    if (!targetMember) {
      this.logger.error(
        `No target member found in conversation ${conversation.id}`,
      );
      return;
    }

    const [currentUserRes, targetUserRes] = await Promise.all([
      this.userIntegrationPort.getUserById(event.senderId),
      this.userIntegrationPort.getUserById(targetMember.userId),
    ]);

    if (currentUserRes.isError() || targetUserRes.isError()) {
      this.logger.error(`Could not fetch users for message broadcast`);
      return;
    }

    let rooms = [`user-${targetUserRes.value.id}`];
    rooms = rooms.filter((x) => !event.deletedForUserIds.includes(x));

    await this.chatWsGateway.serverBroadcast<UserMessageCreated>(
      this.chatWsGateway.server,
      rooms,
      new UserMessageCreatedEvent({
        id: event.messageId,
        seen: false,
        createdAt: event.createdAt.toISOString(),
        user: {
          id: currentUserRes.value.id,
          username: currentUserRes.value.username,
          name: `${currentUserRes.value.firstName} ${currentUserRes.value.lastName}`,
          avatar: currentUserRes.value.avatar,
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
  }
}
