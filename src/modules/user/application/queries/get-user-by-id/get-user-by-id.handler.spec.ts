import { Test, TestingModule } from '@nestjs/testing';
import { GetUserByIdHandler } from './get-user-by-id.handler';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { UserNotFoundException } from '@modules/user/domain/user.exceptions';

describe('GetUserByIdHandler', () => {
  let handler: GetUserByIdHandler;
  let userRepo: jest.Mocked<UserReadRepositoryPort>;

  beforeEach(async () => {
    userRepo = {
      getUserById: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserByIdHandler,
        { provide: UserReadRepositoryPort, useValue: userRepo },
      ],
    }).compile();

    handler = module.get<GetUserByIdHandler>(GetUserByIdHandler);
  });

  it('should throw UserNotFoundException if user is not found', async () => {
    userRepo.getUserById.mockResolvedValue(null);
    const query = new GetUserByIdQuery('user-1');

    await expect(handler.execute(query)).rejects.toThrow(UserNotFoundException);
    expect(userRepo.getUserById).toHaveBeenCalledWith('user-1');
  });

  it('should return user if found', async () => {
    const user = { id: 'user-1', username: 'testuser' } as any;
    userRepo.getUserById.mockResolvedValue(user);

    const query = new GetUserByIdQuery('user-1');
    const result = await handler.execute(query);

    expect(result).toEqual(user);
    expect(userRepo.getUserById).toHaveBeenCalledWith('user-1');
  });
});
