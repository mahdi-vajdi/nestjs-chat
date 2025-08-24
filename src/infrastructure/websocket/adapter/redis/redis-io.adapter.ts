import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplication, Logger } from '@nestjs/common';
import { WS_CONFIG_TOKEN, WsConfig } from '@presentation/ws/ws.config';
import { ConfigService } from '@nestjs/config';
import { BroadcastProvider } from '@infrastructure/websocket/broadcast/providers/broadcast.provider';
import { IRedisProvider } from '@infrastructure/redis/providers/redis.provider';
import { Socket } from 'socket.io';
import { MessageMappingProperties } from '@nestjs/websockets';
import {
  filter,
  first,
  fromEvent,
  map,
  mergeMap,
  Observable,
  share,
  takeUntil,
  timeout,
} from 'rxjs';
import { DISCONNECT_EVENT } from '@nestjs/websockets/constants';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { TryCatch } from '@common/decorators/try-catch.decorator';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private readonly socketConfig: WsConfig;
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    readonly configService: ConfigService,
    readonly app: INestApplication,
    private readonly redisProviderPub: IRedisProvider,
    private readonly redisProviderSub: IRedisProvider,
    private readonly broadcastProvider: BroadcastProvider,
  ) {
    super(app);
    this.socketConfig = configService.get<WsConfig>(WS_CONFIG_TOKEN);
  }

  @TryCatch
  async connectToRedis(): Promise<void> {
    this.adapterConstructor = createAdapter(
      this.redisProviderPub.getClient(),
      this.redisProviderSub.getClient().duplicate(),
    );
  }

  override createIOServer(port: number, options?: any): any {
    const socketPort = this.socketConfig.port ?? port;

    this.logger.log(`Creating Socket.IO server on port ${socketPort}`);
    const server = super.createIOServer(this.socketConfig.port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Redis adapter applied to Socket.IO server');
    }

    const setServer = this.broadcastProvider.setServer(server);
    if (!setServer)
      throw Error(
        'Error setting server in the RedisIoAdapter createIOServer method',
      );

    this.logger.log(
      `Socket.IO server successfully created on port ${socketPort}`,
    );
    return server;
  }

  override bindMessageHandlers(
    socket: Socket,
    handlers: MessageMappingProperties[],
    transform: (data: any) => Observable<any>,
  ) {
    const disconnect$ = fromEvent(socket, DISCONNECT_EVENT).pipe(
      share(),
      first(),
    );

    handlers.forEach(({ message, callback }) => {
      this.logger.verbose(
        `Binding message handler for: ${message} on socket ${socket.id}`,
      );
      const source$ = fromEvent(socket, message).pipe(
        timeout(30000),
        mergeMap((payload) => {
          const { data, ack } = this.mapPayload(payload);

          return transform(callback({ data, ack }, ack)).pipe(
            filter((response) => !isNil(response)),
            map((response) => [response, ack]),
          );
        }),
        takeUntil(disconnect$),
      );

      source$.subscribe({
        next: ([response, ack]) => {
          if (response.event) {
            socket.emit(response.event, response.data);
          }

          if (typeof ack === 'function') {
            try {
              ack(response.data ?? null);
            } catch (e) {
              this.logger.error(`Ack error for message ${message}: ${e}`);
            }
          }
        },
        error: (err) => {
          this.logger.error(`Error handling message ${message}: ${err}`);
        },
      });
    });
  }
}
