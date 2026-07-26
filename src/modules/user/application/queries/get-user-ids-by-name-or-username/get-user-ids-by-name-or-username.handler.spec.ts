import { Test, TestingModule } from '@nestjs/testing';
import { GetUserIdsByNameOrUsernameHandler } from './get-user-ids-by-name-or-username.handler';
import { GetUserIdsByNameOrUsernameQuery } from './get-user-ids-by-name-or-username.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';

describe('GetUserIdsByNameOrUsernameHandler', () => {
  let handler: GetUserIdsByNameOrUsernameHandler;
  let userRepository: jest.Mocked<UserReadRepositoryPort>;

  beforeEach(async () => {
    userRepository = {
      getUserIdsByNameOrUsername: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserIdsByNameOrUsernameHandler,
        {
          provide: UserReadRepositoryPort,
          useValue: userRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUserIdsByNameOrUsernameHandler>(
      GetUserIdsByNameOrUsernameHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return matching user ids based on the filter', async () => {
      const query = new GetUserIdsByNameOrUsernameQuery('John');
      const expectedIds = ['user-1', 'user-2'];

      userRepository.getUserIdsByNameOrUsername.mockResolvedValue(expectedIds);

      const result = await handler.execute(query);

      expect(userRepository.getUserIdsByNameOrUsername).toHaveBeenCalledWith(
        'John',
      );
      expect(result).toEqual(expectedIds);
    });
  });
});
