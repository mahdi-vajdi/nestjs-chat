import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Socket } from 'socket.io';
import { inspect } from 'node:util';
import { BaseWsEvent } from '@common/websocket/base-ws-event';
import { Result } from '@common/result/result';
import { Logger } from '@nestjs/common';

export abstract class BaseWsGateway {
  abstract getLogger(): Logger;

  @TryCatch
  async broadcast<T>(
    client: Socket,
    rooms: string[],
    event: BaseWsEvent<T>,
  ): Promise<Result<boolean>> {
    if (rooms.length === 0) {
      this.getLogger().log(
        `Rooms are empty; Skipping broadcast for event ${event.eventName}`,
      );
      return Result.ok(false);
    }

    this.getLogger().debug(
      `Broadcasting event ${event.eventName} to rooms ${rooms}: ${inspect(event.data)}`,
    );
    client.broadcast.to(rooms).emit(event.eventName, event.data);

    return Result.ok(true);
  }
}
