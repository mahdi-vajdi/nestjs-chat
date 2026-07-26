import { Test, TestingModule } from '@nestjs/testing';
import { UnblockUserHandler } from './unblock-user.handler';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { UnblockUserCommand } from './unblock-user.command';
import { UserNotFoundException } from '@modules/user/domain/user.exceptions';
import { UserEntity } from '@modules/user/domain/models/user.model';

describe('UnblockUserHandler', () => {
  let handler: UnblockUserHandler;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    userRepository = {
      getUserById: jest.fn(),
      unblock: jest.fn(),
      getBlockStatus: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        obj.apply = jest.fn();
        return obj;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnblockUserHandler,
        { provide: UserRepositoryPort, useValue: userRepository },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<UnblockUserHandler>(UnblockUserHandler);
  });

  it('should throw UserNotFoundException if unblocker is not found', async () => {
    userRepository.getUserById.mockResolvedValueOnce(null);
    const command = new UnblockUserCommand('unblocker-1', 'unblocked-1');

    await expect(handler.execute(command)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith('unblocker-1');
  });

  it('should return false if user was not blocked', async () => {
    const unblocker = UserEntity.create('unblocker@test.com', 'unblocker');
    userRepository.getUserById.mockResolvedValueOnce(unblocker);
    userRepository.getBlockStatus.mockResolvedValueOnce(false);

    const command = new UnblockUserCommand(unblocker.id, 'unblocked-1');
    const result = await handler.execute(command);

    expect(result).toBe(false);
    expect(userRepository.unblock).not.toHaveBeenCalled();
  });

  it('should successfully unblock user', async () => {
    const unblocker = UserEntity.create('unblocker@test.com', 'unblocker');

    // reset blockedUsers to simulate state
    (unblocker as any)._blockedUsers = [{ id: 'unblocked-1' }];
    unblocker.unblockUser = jest.fn().mockImplementation(() => {
      (unblocker as any)._blockedUsers = [];
    });

    userRepository.getUserById.mockResolvedValueOnce(unblocker);
    userRepository.getBlockStatus.mockResolvedValueOnce(true);

    const command = new UnblockUserCommand(unblocker.id, 'unblocked-1');
    const result = await handler.execute(command);

    expect(result).toBe(true);
    expect(userRepository.unblock).toHaveBeenCalledWith(
      unblocker.id,
      'unblocked-1',
    );
    expect(publisher.mergeObjectContext).toHaveBeenCalledWith(unblocker);
    expect((unblocker as any).commit).toHaveBeenCalled();
  });
});
