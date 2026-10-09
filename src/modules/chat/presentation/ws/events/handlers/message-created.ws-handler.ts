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
    let convEntity: any;

    try {
      convEntity = await this.commandRepo.getConversationById(
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

      let replyTo = null;
      if (event.replyToMessageId) {
        try {
          const parentMsg = await this.commandRepo.getMessageById(
            event.replyToMessageId,
          );
          if (parentMsg) {
            const parentMember = convEntity?.members?.find(
              (m: any) => m.id === parentMsg.senderId,
            );
            const parentUserId = parentMember ? parentMember.userId : null;
            let parentUser = null;
            if (parentUserId) {
              parentUser =
                parentUserId === currentUser.id
                  ? currentUser
                  : parentUserId === targetUser.id
                    ? targetUser
                    : await this.userIntegrationPort.getUserById(parentUserId);
            }

            replyTo = {
              id: parentMsg.id,
              content: parentMsg.deletedAt ? null : parentMsg.text,
              createdAt: parentMsg.createdAt.toISOString(),
              senderId: parentUserId || parentMsg.senderId,
              user: parentUser
                ? {
                    id: parentUser.id,
                    username: parentUser.username,
                    name: `${parentUser.firstName} ${parentUser.lastName}`,
                    avatar: parentUser.avatar,
                  }
                : null,
            };
          }
        } catch (e) {
          this.logger.warn(
            `Failed to resolve replyTo preview for message ${event.messageId}: ${e}`,
          );
        }
      }

      const rooms: string[] = [];
      if (!event.deletedForUserIds.includes(targetUser.id)) {
        rooms.push(`user-${targetUser.id}`);
      }
      // Also broadcast to the sender's user room for multi-device sync
      rooms.push(`user-${currentUser.id}`);

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
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            avatar: currentUser.avatar,
            username: currentUser.username,
          },
          replyToMessageId: event.replyToMessageId ?? null,
          replyTo,
        }),
      );
    } catch {
      this.logger.error(`Could not fetch users for message broadcast`);
    }
  }
}
