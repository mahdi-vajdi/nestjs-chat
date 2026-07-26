import { Test, TestingModule } from '@nestjs/testing';
import { BlockUserHandler } from './block-user.handler';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { BlockUserCommand } from './block-user.command';
import { UserNotFoundException } from '@modules/user/domain/user.exceptions';
import { UserEntity } from '@modules/user/domain/models/user.model';

describe('BlockUserHandler', () => {
  let handler: BlockUserHandler;
  let userRepository: jest.Mocked<UserRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    userRepository = {
      getUserById: jest.fn(),
      block: jest.fn(),
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
        BlockUserHandler,
        { provide: UserRepositoryPort, useValue: userRepository },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<BlockUserHandler>(BlockUserHandler);
  });

  it('should throw UserNotFoundException if blocker is not found', async () => {
    userRepository.getUserById.mockResolvedValueOnce(null);
    const command = new BlockUserCommand('blocker-1', 'blocked-1');

    await expect(handler.execute(command)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith('blocker-1');
  });

  it('should throw UserNotFoundException if blocked user is not found', async () => {
    userRepository.getUserById
      .mockResolvedValueOnce({} as any)
      .mockResolvedValueOnce(null);
    const command = new BlockUserCommand('blocker-1', 'blocked-1');

    await expect(handler.execute(command)).rejects.toThrow(
      UserNotFoundException,
    );
    expect(userRepository.getUserById).toHaveBeenCalledWith('blocked-1');
  });

  it('should successfully block user', async () => {
    const blocker = UserEntity.create('blocker@test.com', 'blocker');
    const blocked = UserEntity.create('blocked@test.com', 'blocked');

    userRepository.getUserById
      .mockResolvedValueOnce(blocker)
      .mockResolvedValueOnce(blocked);
    userRepository.getBlockStatus.mockResolvedValueOnce(false);

    const command = new BlockUserCommand(blocker.id, blocked.id);
    const result = await handler.execute(command);

    expect(result).toBe(true);
    expect(userRepository.block).toHaveBeenCalledWith(blocker.id, blocked.id);
    expect(publisher.mergeObjectContext).toHaveBeenCalledWith(blocker);
    expect((blocker as any).commit).toHaveBeenCalled();
  });
});
