import { Test, TestingModule } from '@nestjs/testing';
import { DeleteUserHandler } from './delete-user.handler';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { DeleteUserCommand } from './delete-user.command';
import { Logger } from '@nestjs/common';

describe('DeleteUserHandler', () => {
  let handler: DeleteUserHandler;
  let userRepository: jest.Mocked<UserRepositoryPort>;

  beforeEach(async () => {
    userRepository = {
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserHandler,
        { provide: UserRepositoryPort, useValue: userRepository },
      ],
    }).compile();

    handler = module.get<DeleteUserHandler>(DeleteUserHandler);
  });

  it('should successfully delete a user', async () => {
    userRepository.delete.mockResolvedValue(true);
    const command = new DeleteUserCommand('user-1');

    await handler.execute(command);

    expect(userRepository.delete).toHaveBeenCalledWith('user-1');
  });

  it('should log a warning if user is not found or not deleted', async () => {
    userRepository.delete.mockResolvedValue(false);
    const loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const command = new DeleteUserCommand('user-2');

    await handler.execute(command);

    expect(userRepository.delete).toHaveBeenCalledWith('user-2');
    expect(loggerSpy).toHaveBeenCalledWith(
      'User with ID user-2 not found or could not be deleted.',
    );
  });
});
