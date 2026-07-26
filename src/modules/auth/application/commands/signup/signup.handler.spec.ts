import { Test, TestingModule } from '@nestjs/testing';
import { SignupHandler } from './signup.handler';
import { UserIntegrationPort } from '@modules/auth/application/ports/user-integration.port';
import { TokenService } from '@modules/auth/application/services/token.service';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { EventBus, EventPublisher } from '@nestjs/cqrs';
import { SignupCommand } from './signup.command';
import { SignupFailedEvent } from '@modules/auth/domain/events/signup-failed.event';
import { TokenGenerationException } from '@modules/auth/domain/auth.exceptions';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('SignupHandler', () => {
  let handler: SignupHandler;
  let userIntegrationPort: jest.Mocked<UserIntegrationPort>;
  let tokenService: jest.Mocked<TokenService>;
  let authRepository: jest.Mocked<AuthRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    userIntegrationPort = {
      createUser: jest.fn(),
      validatePassword: jest.fn(),
    } as any;

    tokenService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as any;

    authRepository = {
      save: jest.fn(),
      deleteRefreshToken: jest.fn(),
      findByJti: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        return obj;
      }),
    } as any;

    eventBus = {
      publish: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignupHandler,
        { provide: UserIntegrationPort, useValue: userIntegrationPort },
        { provide: TokenService, useValue: tokenService },
        { provide: AuthRepositoryPort, useValue: authRepository },
        { provide: EventPublisher, useValue: publisher },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<SignupHandler>(SignupHandler);
  });

  it('should successfully signup a user', async () => {
    userIntegrationPort.createUser.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      createdAt: new Date(),
    });
    tokenService.signAccessToken.mockResolvedValue('access-token');
    tokenService.signRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      jti: 'jti-1',
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

    const command = new SignupCommand(
      'test@test.com',
      'password',
      'Test',
      'User',
    );
    const result = await handler.execute(command);

    expect(result.id).toBe('user-1');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(authRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should publish SignupFailedEvent and throw error if token saving fails', async () => {
    userIntegrationPort.createUser.mockResolvedValue({
      id: 'user-2',
      role: 'USER',
      createdAt: new Date(),
    });
    tokenService.signAccessToken.mockResolvedValue('access-token');
    tokenService.signRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      jti: 'jti-2',
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

    authRepository.save.mockRejectedValue(new Error('DB Error'));

    const command = new SignupCommand(
      'test@test.com',
      'password',
      'Test',
      'User',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      TokenGenerationException,
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      new SignupFailedEvent('user-2'),
    );
  });
});
