import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MessageDeletedDomainEvent } from '@modules/chat/contracts/events';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';
import {
  UserMessageDeleted,
  UserMessageDeletedEvent,
} from '@modules/chat/presentation/ws/events/message-deleted.event';

@EventsHandler(MessageDeletedDomainEvent)
export class MessageDeletedWsEventHandler implements IEventHandler<MessageDeletedDomainEvent> {
  private readonly logger = new Logger(MessageDeletedWsEventHandler.name);

  constructor(
    private readonly chatWsGateway: ChatWsGateway,
    private readonly commandRepo: ConversationRepositoryPort,
  ) {}

  async handle(event: MessageDeletedDomainEvent) {
    this.logger.debug(
      `Handling MessageDeletedDomainEvent for message ${event.messageId} with scope ${event.scope}`,
    );

    let rooms: string[] = [];

    if (event.scope === MessageDeleteScope.ME) {
      // Delete for me: only notify the actor's user room (for multi-device / multi-tab sync)
      rooms = [`user-${event.actorUserId}`];
    } else {
      // Delete for everyone: notify all conversation members who haven't already deleted this message
      let convEntity;
      try {
        convEntity = await this.commandRepo.getConversationById(
          event.conversationId,
        );
        if (!convEntity) {
          throw new Error('Conversation not found');
        }
      } catch {
        this.logger.error(
          `Could not find conversation for deleted message ${event.messageId}`,
        );
        return;
      }

      for (const member of convEntity.members) {
        if (!event.deletedForUserIds.includes(member.userId)) {
          rooms.push(`user-${member.userId}`);
        }
      }
    }

    if (rooms.length === 0) {
      return;
    }

    await this.chatWsGateway.serverBroadcast<UserMessageDeleted>(
      this.chatWsGateway.server,
      rooms,
      new UserMessageDeletedEvent({
        id: event.messageId,
        conversationId: event.conversationId,
        scope: event.scope,
        deletedAt: event.deletedAt ? event.deletedAt.toISOString() : undefined,
      }),
    );
  }
}
