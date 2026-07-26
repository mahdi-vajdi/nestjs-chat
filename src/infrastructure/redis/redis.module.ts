import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { redisConfig } from '@infrastructure/redis/redis.config';
import { RedisProvider } from '@infrastructure/redis/redis.provider';
import { RedisClient } from '@infrastructure/redis/redis.client';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: RedisProvider,
      useFactory: async (redisConf: ConfigType<typeof redisConfig>) => {
        const client = new RedisClient(redisConf, 0);
        await client.connect();

        return client;
      },
      inject: [redisConfig.KEY],
    },
  ],
  exports: [RedisProvider],
})
export class RedisModule {}
