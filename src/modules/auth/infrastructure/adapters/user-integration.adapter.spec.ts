import { Test, TestingModule } from '@nestjs/testing';
import { UserIntegrationAdapter } from './user-integration.adapter';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ValidatePasswordQuery } from '@modules/user/application/queries/validate-password/validate-password.query';
import { CreateUserCommand } from '@modules/user/application/commands/create-user/create-user.command';

describe('UserIntegrationAdapter', () => {
  let adapter: UserIntegrationAdapter;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIntegrationAdapter,
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    adapter = module.get<UserIntegrationAdapter>(UserIntegrationAdapter);
  });

  describe('validatePassword', () => {
    it('should execute ValidatePasswordQuery and return AuthUser', async () => {
      queryBus.execute.mockResolvedValue({
        id: 'user-1',
        role: 'admin',
        firstName: 'j',
        lastName: 's',
        createdAt: new Date(),
      });
      const result = await adapter.validatePassword('john', 'pass');
      expect(queryBus.execute).toHaveBeenCalledWith(
        new ValidatePasswordQuery('john', 'pass'),
      );
      expect(result.id).toBe('user-1');
      expect(result.role).toBe('admin');
    });
  });

  describe('createUser', () => {
    it('should execute CreateUserCommand and return AuthUser', async () => {
      commandBus.execute.mockResolvedValue({
        id: 'user-2',
        role: 'user',
        firstName: 'a',
        lastName: 'b',
        createdAt: new Date(),
      });
      const result = await adapter.createUser({
        email: 'e',
        username: 'u',
        password: 'p',
        firstName: 'a',
        lastName: 'b',
        avatar: 'pic',
      });
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateUserCommand('e', 'u', 'p', 'a', 'b', 'pic'),
      );
      expect(result.id).toBe('user-2');
    });
  });
});
