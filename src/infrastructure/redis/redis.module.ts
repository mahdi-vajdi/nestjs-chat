import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { redisConfig } from '@infrastructure/redis/configs/redis.config';
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
      useFactory: async (redisConf: ConfigType<typeof redisConfig>) => {
        const client = new IORedisClient(redisConf, 0);
        await client.connect();

        return client;
      },
      inject: [redisConfig.KEY],
    },
    {
      provide: REDIS_DB1_PROVIDER,
      useFactory: async (redisConf: ConfigType<typeof redisConfig>) => {
        const client = new IORedisClient(redisConf, 1);
        await client.connect();

        return client;
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: [REDIS_DB0_PROVIDER, REDIS_DB1_PROVIDER],
})
export class RedisModule {}
