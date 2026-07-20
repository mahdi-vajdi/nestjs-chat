import { IRedisProvider } from '@infrastructure/redis/providers/redis.provider';
import Redis from 'ioredis';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { redisConfig } from '@infrastructure/redis/configs/redis.config';

export class IORedisClient implements IRedisProvider, OnApplicationShutdown {
  private readonly client: Redis;
  private readonly logger = new Logger(IORedisClient.name);

  constructor(
    private readonly redisConf: ConfigType<typeof redisConfig>,
    private readonly dbIndex: number,
  ) {
    this.client = new Redis({
      host: redisConf.host,
      port: redisConf.port,
      username: redisConf.username,
      password: redisConf.password,
      db: dbIndex,
      lazyConnect: true,
      showFriendlyErrorStack: false, // only use in development
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.logger.log(`Connected to the redis client with index ${this.dbIndex}`);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    this.logger.log(
      `Disconnected from the redis client with index ${this.dbIndex}`,
    );
  }

  getClient(): Redis {
    return this.client;
  }

  async onApplicationShutdown() {
    await this.disconnect();
  }
}
