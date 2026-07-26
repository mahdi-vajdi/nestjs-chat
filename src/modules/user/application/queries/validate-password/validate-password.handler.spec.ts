import { Test, TestingModule } from '@nestjs/testing';
import { ValidatePasswordHandler } from './validate-password.handler';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';
import { ValidatePasswordQuery } from './validate-password.query';
import { InvalidCredentialsException } from '@modules/user/domain/user.exceptions';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('ValidatePasswordHandler', () => {
  let handler: ValidatePasswordHandler;
  let userRepo: jest.Mocked<UserReadRepositoryPort>;

  beforeEach(async () => {
    userRepo = {
      getUserByEmail: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
      getUsersByIds: jest.fn(),
      getUserIdsByNameOrUsername: jest.fn(),
      getBlockStatus: jest.fn(),
      getBlockedUserIds: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidatePasswordHandler,
        { provide: UserReadRepositoryPort, useValue: userRepo },
      ],
    }).compile();

    handler = module.get<ValidatePasswordHandler>(ValidatePasswordHandler);
  });

  it('should throw InvalidCredentialsException if email does not exist', async () => {
    userRepo.getUserByEmail.mockResolvedValue(null);
    const query = new ValidatePasswordQuery('test@test.com', 'password');

    await expect(handler.execute(query)).rejects.toThrow(
      InvalidCredentialsException,
    );
    expect(userRepo.getUserByEmail).toHaveBeenCalledWith('test@test.com');
  });

  it('should throw InvalidCredentialsException if username does not exist', async () => {
    userRepo.getUserByUsername.mockResolvedValue(null);
    const query = new ValidatePasswordQuery('testuser', 'password');

    await expect(handler.execute(query)).rejects.toThrow(
      InvalidCredentialsException,
    );
    expect(userRepo.getUserByUsername).toHaveBeenCalledWith('testuser');
  });

  it('should throw InvalidCredentialsException if password does not match', async () => {
    const user = { id: '1', password: 'hashed-password' } as any;
    userRepo.getUserByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const query = new ValidatePasswordQuery('test@test.com', 'password');

    await expect(handler.execute(query)).rejects.toThrow(
      InvalidCredentialsException,
    );
  });

  it('should successfully validate password and return user', async () => {
    const user = { id: '1', password: 'hashed-password' } as any;
    userRepo.getUserByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const query = new ValidatePasswordQuery('test@test.com', 'password');
    const result = await handler.execute(query);

    expect(result).toEqual(user);
  });
});
