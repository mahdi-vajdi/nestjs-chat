import { RedisProvider } from '@infrastructure/redis/redis.provider';
import Redis from 'ioredis';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { redisConfig } from '@infrastructure/redis/redis.config';

export class RedisClient implements RedisProvider, OnApplicationShutdown {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisClient.name);

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
      connectTimeout: 10000,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis Client Error (DB ${this.dbIndex}):`, err);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn(`Redis Client reconnecting (DB ${this.dbIndex})...`);
    });

    this.client.on('ready', () => {
      this.logger.log(`Redis Client is ready (DB ${this.dbIndex})`);
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
