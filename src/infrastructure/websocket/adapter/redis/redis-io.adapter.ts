import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { INestApplication, Logger } from '@nestjs/common';
import { wsConfig } from '@infrastructure/websocket/ws.config';
import { ConfigType } from '@nestjs/config';
import { RedisProvider } from '@infrastructure/redis/redis.provider';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    private readonly socketConfig: ConfigType<typeof wsConfig>,
    readonly app: INestApplication,
    private readonly redisProvider: RedisProvider,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = this.redisProvider.getClient();
    const subClient = pubClient.duplicate();

    this.adapterConstructor = createAdapter(pubClient, subClient);
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
