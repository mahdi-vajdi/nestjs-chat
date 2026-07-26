import { RedisIoAdapter } from './redis-io.adapter';
import { INestApplication } from '@nestjs/common';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisProvider } from '@infrastructure/redis/redis.provider';

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn().mockReturnValue('mock-adapter'),
}));

describe('RedisIoAdapter', () => {
  let adapter: RedisIoAdapter;
  let app: jest.Mocked<INestApplication>;
  let redisClient: any;
  let redisProvider: jest.Mocked<RedisProvider>;

  beforeEach(() => {
    redisClient = {
      duplicate: jest.fn().mockReturnValue({}),
    };
    app = {} as unknown as jest.Mocked<INestApplication>;
    redisProvider = {
      getClient: jest.fn().mockReturnValue(redisClient),
    } as unknown as jest.Mocked<RedisProvider>;

    adapter = new RedisIoAdapter({ port: 3000 } as any, app, redisProvider);
  });

  describe('connectToRedis', () => {
    it('should connect pub and sub clients and create adapter', async () => {
      await adapter.connectToRedis();

      expect(redisProvider.getClient).toHaveBeenCalled();
      expect(redisClient.duplicate).toHaveBeenCalledTimes(1);
      expect(createAdapter).toHaveBeenCalled();
    });
  });

  describe('createIOServer', () => {
    it('should configure io server with redis adapter', () => {
      adapter['adapterConstructor'] = 'test-adapter' as any;
      const options = {} as any;

      const server = { adapter: jest.fn() };
      const superCreateIOServer = jest
        .spyOn(
          Object.getPrototypeOf(RedisIoAdapter.prototype),
          'createIOServer',
        )
        .mockReturnValue(server);

      const result = adapter.createIOServer(3000, options);

      expect(superCreateIOServer).toHaveBeenCalledWith(3000, options);
      expect(server.adapter).toHaveBeenCalledWith('test-adapter');
      expect(result).toBe(server);
    });
  });
});
