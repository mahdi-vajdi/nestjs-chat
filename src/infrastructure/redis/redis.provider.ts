import Redis from 'ioredis';

export abstract class RedisProvider {
  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract getClient(): Redis;
}
