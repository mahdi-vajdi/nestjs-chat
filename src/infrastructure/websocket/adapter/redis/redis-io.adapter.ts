import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplication, Logger } from '@nestjs/common';
import { IWsConfig, WS_CONFIG_TOKEN } from '@presentation/ws/ws.config';
import { ConfigService } from '@nestjs/config';
import { IBroadcastProvider } from '@infrastructure/websocket/broadcast/providers/broadcast.provider';
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
} from 'rxjs';
import { DISCONNECT_EVENT } from '@nestjs/websockets/constants';
import { isNil } from '@nestjs/common/utils/shared.utils';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private readonly socketConfig: IWsConfig;

  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    readonly configService: ConfigService,
    readonly app: INestApplication,
    private readonly redisDB0ProviderPub: IRedisProvider,
    private readonly redisDB0ProviderSub: IRedisProvider,
    private readonly broadcastProvider: IBroadcastProvider,
  ) {
    super(app);
    this.socketConfig = configService.get<IWsConfig>(WS_CONFIG_TOKEN);
  }

  async connectToRedis(): Promise<void> {
    this.adapterConstructor = createAdapter(
      this.redisDB0ProviderPub.getClient(),
      this.redisDB0ProviderSub.getClient().duplicate(),
    );
  }

  override createIOServer(port: number, options?: any): any {
    this.logger.log(`Socket is running on port ${this.socketConfig.port}`);

    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    const setServer = this.broadcastProvider.setServer(server);
    if (!setServer)
      throw Error(
        'Error setting server in the RedisIoAdapter createIOServer method',
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
      const source$ = fromEvent(socket, message).pipe(
        mergeMap((payload) => {
          const { data, ack } = this.mapPayload(payload);

          return transform(callback({ data, ack }, ack)).pipe(
            filter((response) => !isNil(response)),
            map((response) => [response, ack]),
          );
        }),
        takeUntil(disconnect$),
      );

      source$.subscribe(([response, ack]) => {
        if (response.event) return socket.emit(response.event, response.data);
      });
    });
  }
}
