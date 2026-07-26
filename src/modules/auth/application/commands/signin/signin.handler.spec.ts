import { Test, TestingModule } from '@nestjs/testing';
import { SigninHandler } from './signin.handler';
import { UserIntegrationPort } from '@modules/auth/application/ports/user-integration.port';
import { TokenService } from '@modules/auth/application/services/token.service';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { SigninCommand } from './signin.command';
import { TokenGenerationException } from '@modules/auth/domain/auth.exceptions';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('SigninHandler', () => {
  let handler: SigninHandler;
  let userIntegrationPort: jest.Mocked<UserIntegrationPort>;
  let tokenService: jest.Mocked<TokenService>;
  let authRepository: jest.Mocked<AuthRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SigninHandler,
        { provide: UserIntegrationPort, useValue: userIntegrationPort },
        { provide: TokenService, useValue: tokenService },
        { provide: AuthRepositoryPort, useValue: authRepository },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<SigninHandler>(SigninHandler);
  });

  it('should successfully signin a user', async () => {
    userIntegrationPort.validatePassword.mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    tokenService.signAccessToken.mockResolvedValue('access-token');
    tokenService.signRefreshToken.mockResolvedValue({
      token: 'refresh-token',
      jti: 'jti-1',
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

    const command = new SigninCommand('test@test.com', 'password');
    const result = await handler.execute(command);

    expect(result.user.id).toBe('user-1');
    expect(result.user.firstName).toBe('Test');
    expect(result.tokens.accessToken).toBe('access-token');
    expect(result.tokens.refreshToken).toBe('refresh-token');
    expect(authRepository.save).toHaveBeenCalled();
  });

  it('should throw TokenGenerationException if token saving fails', async () => {
    userIntegrationPort.validatePassword.mockResolvedValue({
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

    const command = new SigninCommand('test@test.com', 'password');

    await expect(handler.execute(command)).rejects.toThrow(
      TokenGenerationException,
    );
  });
});
