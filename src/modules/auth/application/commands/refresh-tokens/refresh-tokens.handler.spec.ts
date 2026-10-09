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

import { UserIntegrationPort } from '@modules/auth/application/ports/user-integration.port';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('RefreshTokensHandler', () => {
  let handler: RefreshTokensHandler;
  let tokenService: jest.Mocked<TokenService>;
  let authRepository: jest.Mocked<AuthRepositoryPort>;
  let userIntegrationPort: jest.Mocked<UserIntegrationPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    tokenService = {
      verifyRefreshToken: jest.fn(),
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    authRepository = {
      getRefreshToken: jest.fn(),
      getRefreshTokenIncludingDeleted: jest.fn(),
      save: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllRefreshTokens: jest.fn(),
    } as unknown as jest.Mocked<AuthRepositoryPort>;

    userIntegrationPort = {
      getUserById: jest.fn(),
    } as unknown as jest.Mocked<UserIntegrationPort>;

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
        { provide: UserIntegrationPort, useValue: userIntegrationPort },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<RefreshTokensHandler>(RefreshTokensHandler);
  });

  describe('execute', () => {
    const command = new RefreshTokensCommand('valid-token');
    const mockPayload = { sub: 'user-1', jti: 'jti-1' };
    let mockEntity: RefreshTokenEntity;
    const mockUser = {
      id: 'user-1',
      role: UserRole.USER,
      createdAt: new Date(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockEntity = RefreshTokenEntity.create('user-1', 'hashed-token', 'jti-1');
    });

    it('should throw InvalidRefreshTokenException if verify fails', async () => {
      tokenService.verifyRefreshToken.mockRejectedValue(new Error());

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should throw InvalidRefreshTokenException if token not found in db', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshTokenIncludingDeleted.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should detect token reuse and revoke all sessions if token was already deleted', async () => {
      const revokedEntity = RefreshTokenEntity.create(
        'user-1',
        'hashed-token',
        'jti-1',
      );
      revokedEntity.revoke();

      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshTokenIncludingDeleted.mockResolvedValue(
        revokedEntity,
      );

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
      expect(authRepository.revokeAllRefreshTokens).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('should throw InvalidRefreshTokenException if hash compare fails', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshTokenIncludingDeleted.mockResolvedValue(
        mockEntity,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should throw InvalidRefreshTokenException if user is not found', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshTokenIncludingDeleted.mockResolvedValue(
        mockEntity,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userIntegrationPort.getUserById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });

    it('should revoke old token, rotate new, and return output', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshTokenIncludingDeleted.mockResolvedValue(
        mockEntity,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userIntegrationPort.getUserById.mockResolvedValue(mockUser);
      tokenService.signAccessToken.mockResolvedValue('new-access');
      tokenService.signRefreshToken.mockResolvedValue({
        token: 'new-refresh',
        jti: 'new-jti',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      authRepository.rotateRefreshToken.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(mockEntity.deletedAt).not.toBeNull();
      expect(authRepository.rotateRefreshToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should throw TokenGenerationException if rotateRefreshToken fails', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue(mockPayload);
      authRepository.getRefreshTokenIncludingDeleted.mockResolvedValue(
        mockEntity,
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      userIntegrationPort.getUserById.mockResolvedValue(mockUser);
      tokenService.signAccessToken.mockResolvedValue('new-access');
      tokenService.signRefreshToken.mockResolvedValue({
        token: 'new-refresh',
        jti: 'new-jti',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      authRepository.rotateRefreshToken.mockRejectedValue(
        new Error('DB failure'),
      );

      await expect(handler.execute(command)).rejects.toThrow(
        TokenGenerationException,
      );
    });
  });
});
