import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  REDIS_DB0_PROVIDER,
  REDIS_DB1_PROVIDER,
} from '@infrastructure/redis/providers/redis.provider';
import { IORedisClient } from '@infrastructure/redis/ioredis/ioredis-client';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_DB0_PROVIDER,
      useFactory: async (configService: ConfigService) => {
        const client = new IORedisClient(configService, 0);
        await client.connect();

        return client;
      },
    },
    {
      provide: REDIS_DB1_PROVIDER,
      useFactory: async (configService: ConfigService) => {
        const client = new IORedisClient(configService, 1);
        await client.connect();

        return client;
      },
    },
  ],
  exports: [REDIS_DB0_PROVIDER, REDIS_DB1_PROVIDER],
})
export class RedisModule {}
