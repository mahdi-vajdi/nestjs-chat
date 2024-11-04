import Redis from 'ioredis';

export interface RedisProvider {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  getClient(): Redis;
}

export const REDIS_DB0_PROVIDER = 'redis-db0-provider';
export const REDIS_DB1_PROVIDER = 'redis-db1-provider';
