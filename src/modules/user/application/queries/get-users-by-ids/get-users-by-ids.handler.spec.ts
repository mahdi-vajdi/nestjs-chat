import { Test, TestingModule } from '@nestjs/testing';
import { GetUsersByIdsHandler } from './get-users-by-ids.handler';
import { GetUsersByIdsQuery } from './get-users-by-ids.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';
import { UserReadDto } from '@modules/user/application/dtos/user-read.dto';
import { UserRole } from '@modules/user/domain/enums/user-role.enum';

describe('GetUsersByIdsHandler', () => {
  let handler: GetUsersByIdsHandler;
  let userRepository: jest.Mocked<UserReadRepositoryPort>;

  beforeEach(async () => {
    userRepository = {
      getUsersByIds: jest.fn(),
    } as unknown as jest.Mocked<UserReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersByIdsHandler,
        {
          provide: UserReadRepositoryPort,
          useValue: userRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUsersByIdsHandler>(GetUsersByIdsHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return an array of users', async () => {
      const query = new GetUsersByIdsQuery(['user-1', 'user-2']);
      const users: UserReadDto[] = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          firstName: 'User',
          lastName: 'One',
          avatar: null,
          role: UserRole.USER,
          createdAt: new Date(),
        },
      ];

      userRepository.getUsersByIds.mockResolvedValue(users);

      const result = await handler.execute(query);

      expect(userRepository.getUsersByIds).toHaveBeenCalledWith([
        'user-1',
        'user-2',
      ]);
      expect(result).toEqual(users);
    });
  });
});
