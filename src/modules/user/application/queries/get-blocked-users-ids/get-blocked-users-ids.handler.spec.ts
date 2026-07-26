import { Test, TestingModule } from '@nestjs/testing';
import { GetBlockedUsersIdsHandler } from './get-blocked-users-ids.handler';
import { GetBlockedUsersIdsQuery } from './get-blocked-users-ids.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';

describe('GetBlockedUsersIdsHandler', () => {
  let handler: GetBlockedUsersIdsHandler;
  let userRepository: jest.Mocked<UserReadRepositoryPort>;

  beforeEach(async () => {
    userRepository = {
      getBlockedUserIds: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetBlockedUsersIdsHandler,
        {
          provide: UserReadRepositoryPort,
          useValue: userRepository,
        },
      ],
    }).compile();

    handler = module.get<GetBlockedUsersIdsHandler>(GetBlockedUsersIdsHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return the blocked user ids from the repository', async () => {
      const query = new GetBlockedUsersIdsQuery('user-id', [
        'target-1',
        'target-2',
      ]);
      const blockedIds = ['target-1'];

      userRepository.getBlockedUserIds.mockResolvedValue(blockedIds);

      const result = await handler.execute(query);

      expect(userRepository.getBlockedUserIds).toHaveBeenCalledWith('user-id', [
        'target-1',
        'target-2',
      ]);
      expect(result).toEqual(blockedIds);
    });
  });
});
