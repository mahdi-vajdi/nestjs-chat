import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserHandler } from './create-user.handler';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { UserAlreadyExistsException } from '@modules/user/domain/user.exceptions';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    userRepository = {
      userExists: jest.fn(),
      save: jest.fn(),
      getUsersByIds: jest.fn(),
      getUserIdsByNameOrUsername: jest.fn(),
      getUserById: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByUsername: jest.fn(),
      getBlockStatus: jest.fn(),
      getBlockedUserIds: jest.fn(),
      block: jest.fn(),
      unblock: jest.fn(),
      delete: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        return obj;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        { provide: UserRepositoryPort, useValue: userRepository },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
  });

  it('should throw UserAlreadyExistsException if email exists', async () => {
    userRepository.userExists.mockResolvedValue(true);
    const command = new CreateUserCommand(
      'test@example.com',
      'testuser',
      'password',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      UserAlreadyExistsException,
    );
    expect(userRepository.userExists).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });

  it('should create user successfully with hashed password', async () => {
    userRepository.userExists.mockResolvedValue(false);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    const command = new CreateUserCommand(
      'test@example.com',
      'testuser',
      'password',
    );
    const user = await handler.execute(command);

    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(publisher.mergeObjectContext).toHaveBeenCalledWith(user);
    expect(user.commit).toHaveBeenCalled();
    expect(user.password).toBe('hashedPassword');
    expect(user.username).toBe('testuser');
  });
});
