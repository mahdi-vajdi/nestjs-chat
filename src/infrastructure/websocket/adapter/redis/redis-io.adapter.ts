import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplication, Logger } from '@nestjs/common';
import { wsConfig } from '@infrastructure/websocket/ws.config';
import { ConfigType } from '@nestjs/config';
import { IRedisProvider } from '@infrastructure/redis/providers/redis.provider';
import { TryCatch } from '@common/decorators/try-catch.decorator';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    private readonly socketConfig: ConfigType<typeof wsConfig>,
    readonly app: INestApplication,
    private readonly redisProviderPub: IRedisProvider,
    private readonly redisProviderSub: IRedisProvider,
  ) {
    super(app);
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

    this.logger.log(
      `Socket.IO server successfully created on port ${socketPort}`,
    );
    return server;
  }
}
