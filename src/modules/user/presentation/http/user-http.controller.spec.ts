import { Test, TestingModule } from '@nestjs/testing';
import { UserHttpController } from './user-http.controller';
import { CommandBus } from '@nestjs/cqrs';
import { BlockUserCommand } from '@modules/user/application/commands/block-user/block-user.command';
import { UnblockUserCommand } from '@modules/user/application/commands/unblock-user/unblock-user.command';
import { ConflictException } from '@nestjs/common';
import { UserHttpGuard } from './guards/user-http.guard';

describe('UserHttpController', () => {
  let controller: UserHttpController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserHttpController],
      providers: [
        {
          provide: CommandBus,
          useValue: commandBus,
        },
      ],
    })
      .overrideGuard(UserHttpGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserHttpController>(UserHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('block', () => {
    it('should execute BlockUserCommand and return empty object on success', async () => {
      commandBus.execute.mockResolvedValue(true);

      const result = await controller.block(
        { targetUserId: 'target-1' },
        'auth-user',
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        new BlockUserCommand('auth-user', 'target-1'),
      );
      expect(result).toEqual({});
    });

    it('should throw ConflictException if user is already blocked', async () => {
      commandBus.execute.mockResolvedValue(false);

      await expect(
        controller.block({ targetUserId: 'target-1' }, 'auth-user'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unblock', () => {
    it('should execute UnblockUserCommand and return empty object', async () => {
      commandBus.execute.mockResolvedValue(true);

      const result = await controller.unblock(
        { targetUserId: 'target-1' },
        'auth-user',
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UnblockUserCommand('auth-user', 'target-1'),
      );
      expect(result).toEqual({});
    });
  });
});
