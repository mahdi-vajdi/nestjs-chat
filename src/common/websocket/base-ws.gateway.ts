import { Server, Socket } from 'socket.io';
import { inspect } from 'node:util';
import { BaseWsEvent } from '@common/websocket/base-ws-event';
import { Logger } from '@nestjs/common';

export abstract class BaseWsGateway {
  abstract getLogger(): Logger;

  async broadcast<T>(
    client: Socket,
    rooms: string[],
    event: BaseWsEvent<T>,
  ): Promise<boolean> {
    if (rooms.length === 0) {
      this.getLogger().log(
        `Rooms are empty; Skipping broadcast for event ${event.eventName}`,
      );
      return false;
    }

    this.getLogger().debug(
      `Broadcasting event ${event.eventName} to rooms ${rooms}: ${inspect(event.data)}`,
    );
    client.broadcast.to(rooms).emit(event.eventName, event.data);

    return true;
  }

  async serverBroadcast<T>(
    server: Server,
    rooms: string[],
    event: BaseWsEvent<T>,
  ): Promise<boolean> {
    if (rooms.length === 0) {
      this.getLogger().log(
        `Rooms are empty; Skipping server broadcast for event ${event.eventName}`,
      );
      return false;
    }

    this.getLogger().debug(
      `Server Broadcasting event ${event.eventName} to rooms ${rooms}: ${inspect(event.data)}`,
    );
    server.to(rooms).emit(event.eventName, event.data);

    return true;
  }
}
