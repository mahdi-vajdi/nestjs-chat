import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokensHandler } from './refresh-tokens.handler';
import { TokenService } from '@modules/auth/application/services/token.service';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { RefreshTokensCommand } from './refresh-tokens.command';
import { UserRole } from '@modules/user/domain/enums/user-role.enum';
import {
  InvalidRefreshTokenException,
  TokenGenerationException,
} from '@modules/auth/domain/auth.exceptions';
import { RefreshTokenEntity } from '@modules/auth/domain/models/refresh-token.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('RefreshTokensHandler', () => {
  let handler: RefreshTokensHandler;
  let tokenService: jest.Mocked<TokenService>;
  let authRepository: jest.Mocked<AuthRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    tokenService = {
      verifyRefreshToken: jest.fn(),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    authRepository = {
      getRefreshToken: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<AuthRepositoryPort>;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((entity) => {
        entity.commit = jest.fn();
        return entity;
      }),
    } as unknown as jest.Mocked<EventPublisher>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensHandler,
        { provide: TokenService, useValue: tokenService },
        { provide: AuthRepositoryPort, useValue: authRepository },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<RefreshTokensHandler>(RefreshTokensHandler);
  });

  describe('execute', () => {
    const command = new RefreshTokensCommand('valid-token', UserRole.USER);
    const mockPayload = { sub: 'user-1', jti: 'jti-1' };
    const mockEntity = RefreshTokenEntity.create(
      'user-1',
      'hashed-token',
      'jti-1',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw InvalidRefreshTokenException if verify fails', async () => {
      tokenService.verifyRefreshToken.mockRejectedValue(new Error());

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should throw InvalidRefreshTokenException if token not found in db', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshToken.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should throw InvalidRefreshTokenException if hash compare fails', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshToken.mockResolvedValue(mockEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should revoke old token, save new, and return output', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshToken.mockResolvedValue(mockEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenService.signAccessToken.mockResolvedValue('new-access');
      tokenService.signRefreshToken.mockResolvedValue({
        token: 'new-refresh',
        jti: 'new-jti',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      authRepository.save.mockResolvedValue({} as any);

      const result = await handler.execute(command);

      expect(mockEntity.deletedAt).not.toBeNull();
      expect(authRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should fallback and throw TokenGenerationException if save fails', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshToken.mockResolvedValue(mockEntity);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      tokenService.signAccessToken.mockResolvedValue('new-access');
      tokenService.signRefreshToken.mockResolvedValue({
        token: 'new-refresh',
        jti: 'new-jti',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      authRepository.save
        .mockResolvedValueOnce({} as any) // revoke success
        .mockRejectedValueOnce(new Error()) // save new token fails
        .mockResolvedValueOnce({} as any); // restore success

      await expect(handler.execute(command)).rejects.toThrow(
        TokenGenerationException,
      );
      expect(mockEntity.deletedAt).toBeNull(); // restored
      expect(authRepository.save).toHaveBeenCalledTimes(3);
    });
  });
});
