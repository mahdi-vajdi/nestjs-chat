import { Test, TestingModule } from '@nestjs/testing';
import { LogoutHandler } from './logout.handler';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { TokenService } from '@modules/auth/application/services/token.service';
import { LogoutCommand } from './logout.command';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let authRepository: jest.Mocked<AuthRepositoryPort>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    authRepository = {
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
    } as unknown as jest.Mocked<AuthRepositoryPort>;

    tokenService = {
      verifyRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutHandler,
        { provide: AuthRepositoryPort, useValue: authRepository },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    handler = module.get<LogoutHandler>(LogoutHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should revoke all tokens if allDevices is true', async () => {
    authRepository.revokeAllRefreshTokens.mockResolvedValue(true);

    const result = await handler.execute(
      new LogoutCommand('user-1', undefined, true),
    );

    expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toBe(true);
  });

  it('should revoke all tokens if refreshToken is not provided', async () => {
    authRepository.revokeAllRefreshTokens.mockResolvedValue(true);

    const result = await handler.execute(
      new LogoutCommand('user-1', undefined, false),
    );

    expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toBe(true);
  });

  it('should revoke specific token if valid refreshToken is provided', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      jti: 'jti-123',
      sub: 'user-1',
    } as any);
    authRepository.revokeRefreshToken.mockResolvedValue(true);

    const result = await handler.execute(
      new LogoutCommand('user-1', 'valid-refresh-token', false),
    );

    expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
      'valid-refresh-token',
    );
    expect(authRepository.revokeRefreshToken).toHaveBeenCalledWith(
      'jti-123',
      'user-1',
    );
    expect(result).toBe(true);
  });

  it('should fallback to revoking all tokens if refreshToken verify fails', async () => {
    tokenService.verifyRefreshToken.mockRejectedValue(
      new Error('Invalid token'),
    );
    authRepository.revokeAllRefreshTokens.mockResolvedValue(true);

    const result = await handler.execute(
      new LogoutCommand('user-1', 'invalid-refresh-token', false),
    );

    expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith(
      'user-1',
    );
    expect(result).toBe(true);
  });
});
