import { Test, TestingModule } from '@nestjs/testing';
import { AuthHttpController } from './auth-http.controller';
import { CommandBus } from '@nestjs/cqrs';
import { SignupCommand } from '@modules/auth/application/commands/signup/signup.command';
import { SigninCommand } from '@modules/auth/application/commands/signin/signin.command';

import { QueryBus } from '@nestjs/cqrs';
import { AuthHttpGuard } from '@modules/auth/presentation/guards/auth-http.guard';

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
        {
          provide: QueryBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: AuthHttpGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
      ],
    })
      .overrideGuard(AuthHttpGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

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

  describe('refresh', () => {
    it('should execute RefreshTokensCommand and return new tokens', async () => {
      const response = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      commandBus.execute.mockResolvedValue(response);

      const body = { refreshToken: 'old-refresh-token' };
      const result = await controller.refresh(body);

      expect(commandBus.execute).toHaveBeenCalled();
      expect(result).toEqual(response);
    });
  });

  describe('logout', () => {
    it('should execute LogoutCommand and return success', async () => {
      commandBus.execute.mockResolvedValue(true);

      const body = { refreshToken: 'valid-refresh-token', allDevices: false };
      const result = await controller.logout('user-1', body);

      expect(commandBus.execute).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
