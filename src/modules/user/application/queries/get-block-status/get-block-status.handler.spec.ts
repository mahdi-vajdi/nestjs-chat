import { Test, TestingModule } from '@nestjs/testing';
import { GetBlockStatusHandler } from './get-block-status.handler';
import { GetBlockStatusQuery } from './get-block-status.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';

describe('GetBlockStatusHandler', () => {
  let handler: GetBlockStatusHandler;
  let userRepository: jest.Mocked<UserReadRepositoryPort>;

  beforeEach(async () => {
    userRepository = {
      getBlockStatus: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBlockStatusHandler,
        {
          provide: UserReadRepositoryPort,
          useValue: userRepository,
        },
      ],
    }).compile();

    handler = module.get<GetBlockStatusHandler>(GetBlockStatusHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return the block status between two users', async () => {
      const query = new GetBlockStatusQuery('user-1', 'user-2');

      // First call (user-1 blocking user-2) -> true
      // Second call (user-2 blocking user-1) -> false
      userRepository.getBlockStatus.mockResolvedValueOnce(true);
      userRepository.getBlockStatus.mockResolvedValueOnce(false);

      const result = await handler.execute(query);

      expect(userRepository.getBlockStatus).toHaveBeenCalledTimes(2);
      expect(userRepository.getBlockStatus).toHaveBeenNthCalledWith(
        1,
        'user-1',
        'user-2',
      );
      expect(userRepository.getBlockStatus).toHaveBeenNthCalledWith(
        2,
        'user-2',
        'user-1',
      );
      expect(result).toEqual({
        isBlocker: true,
        isBlocked: false,
      });
    });
  });
});
