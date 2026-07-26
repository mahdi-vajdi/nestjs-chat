import { Test, TestingModule } from '@nestjs/testing';
import { AuthHttpController } from './auth-http.controller';
import { CommandBus } from '@nestjs/cqrs';
import { SignupCommand } from '@modules/auth/application/commands/signup/signup.command';
import { SigninCommand } from '@modules/auth/application/commands/signin/signin.command';

describe('AuthHttpController', () => {
  let controller: AuthHttpController;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(async () => {
    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthHttpController],
      providers: [
        {
          provide: CommandBus,
          useValue: commandBus,
        },
      ],
    }).compile();

    controller = module.get<AuthHttpController>(AuthHttpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should execute SignupCommand and return the result', async () => {
      const response = { accessToken: 'token', refreshToken: 'token' };
      commandBus.execute.mockResolvedValue(response);

      const body = {
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await controller.signup(body);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new SignupCommand('test@test.com', 'password123', 'Test', 'User'),
      );
      expect(result).toEqual(response);
    });
  });

  describe('signin', () => {
    it('should execute SigninCommand and return the result', async () => {
      const response = { accessToken: 'token', refreshToken: 'token' };
      commandBus.execute.mockResolvedValue(response);

      const body = {
        identifier: 'test@test.com',
        password: 'password123',
      };

      const result = await controller.signin(body as any);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new SigninCommand('test@test.com', 'password123'),
      );
      expect(result).toEqual(response);
    });
  });
});
