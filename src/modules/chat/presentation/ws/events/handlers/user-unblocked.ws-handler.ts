import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserUnblockedEvent } from '@modules/user/contracts/events';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { UserUnblockedWsEvent } from '@modules/chat/presentation/ws/events/user-unblocked.event';

@EventsHandler(UserUnblockedEvent)
export class UserUnblockedWsEventHandler implements IEventHandler<UserUnblockedEvent> {
  private readonly logger = new Logger(UserUnblockedWsEventHandler.name);

  constructor(private readonly chatWsGateway: ChatWsGateway) {}

  async handle(event: UserUnblockedEvent) {
    this.logger.debug(
      `User ${event.unblockerId} unblocked ${event.unblockedId}. Broadcasting WS event.`,
    );

    const rooms = [`user-${event.unblockedId}`, `user-${event.unblockerId}`];

    await this.chatWsGateway.serverBroadcast(
      this.chatWsGateway.server,
      rooms,
      new UserUnblockedWsEvent({
        blockerId: event.unblockerId,
        blockedId: event.unblockedId,
      }),
    );
  }
}
