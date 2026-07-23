import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserBlockedEvent } from '@modules/user/contracts/events';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { UserBlockedWsEvent } from '@modules/chat/presentation/ws/events/user-blocked.event';

@EventsHandler(UserBlockedEvent)
export class UserBlockedWsEventHandler implements IEventHandler<UserBlockedEvent> {
  private readonly logger = new Logger(UserBlockedWsEventHandler.name);

  constructor(private readonly chatWsGateway: ChatWsGateway) {}

  async handle(event: UserBlockedEvent) {
    this.logger.debug(
      `User ${event.blockerId} blocked ${event.blockedId}. Broadcasting WS event.`,
    );

    // Broadcast to BOTH users so their respective UIs can update (e.g. hide input)
    const rooms = [`user-${event.blockedId}`, `user-${event.blockerId}`];

    await this.chatWsGateway.serverBroadcast(
      this.chatWsGateway.server,
      rooms,
      new UserBlockedWsEvent({
        blockerId: event.blockerId,
        blockedId: event.blockedId,
      }),
    );
  }
}
