import { RedisProvider } from '@infrastructure/redis/providers/redis.provider';
import Redis from 'ioredis';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IRedisConfig,
  REDIS_CONFIG_TOKEN,
} from '@infrastructure/redis/configs/redis.config';

export class IORedisClient implements RedisProvider, OnApplicationShutdown {
  private readonly client: Redis;
  private readonly logger = new Logger(IORedisClient.name);

  constructor(
    configService: ConfigService,
    private readonly dbIndex: number,
  ) {
    const redisConfig = configService.get<IRedisConfig>(REDIS_CONFIG_TOKEN);

    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      username: redisConfig.username,
      password: redisConfig.password,
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

  async onApplicationShutdown(signal?: string) {
    await this.disconnect();
  }
}
