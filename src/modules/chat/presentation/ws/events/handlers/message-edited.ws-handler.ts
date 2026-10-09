import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MessageEditedDomainEvent } from '@modules/chat/contracts/events';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { Logger } from '@nestjs/common';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import {
  UserMessageEdited,
  UserMessageEditedEvent,
} from '@modules/chat/presentation/ws/events/message-edited.event';

@EventsHandler(MessageEditedDomainEvent)
export class MessageEditedWsEventHandler implements IEventHandler<MessageEditedDomainEvent> {
  private readonly logger = new Logger(MessageEditedWsEventHandler.name);

  constructor(
    private readonly chatWsGateway: ChatWsGateway,
    private readonly commandRepo: ConversationRepositoryPort,
  ) {}

  async handle(event: MessageEditedDomainEvent) {
    this.logger.debug(
      `Handling MessageEditedDomainEvent for message ${event.messageId}`,
    );

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
        `Could not find conversation for edited message ${event.messageId}`,
      );
      return;
    }

    const rooms: string[] = [];
    for (const member of convEntity.members) {
      if (!event.deletedForUserIds.includes(member.userId)) {
        rooms.push(`user-${member.userId}`);
      }
    }

    if (rooms.length === 0) {
      return;
    }

    await this.chatWsGateway.serverBroadcast<UserMessageEdited>(
      this.chatWsGateway.server,
      rooms,
      new UserMessageEditedEvent({
        id: event.messageId,
        conversationId: event.conversationId,
        content: event.text,
        editedAt: event.editedAt.toISOString(),
      }),
    );
  }
}
