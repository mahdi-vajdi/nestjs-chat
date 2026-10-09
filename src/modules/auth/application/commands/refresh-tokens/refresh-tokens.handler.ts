import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokensCommand } from './refresh-tokens.command';
import { Logger } from '@nestjs/common';

import { TokenService } from '@modules/auth/application/services/token.service';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { RefreshTokenEntity } from '@modules/auth/domain/models/refresh-token.entity';
import { RefreshTokensOutput } from '@modules/auth/application/services/dtos/refresh-tokens.dto';
import { RefreshTokenPayload } from '@modules/auth/domain/types/refresh-token-payload.type';
import * as bcrypt from 'bcrypt';

import {
  InvalidRefreshTokenException,
  TokenGenerationException,
} from '@modules/auth/domain/auth.exceptions';

import { UserIntegrationPort } from '@modules/auth/application/ports/user-integration.port';

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensHandler implements ICommandHandler<
  RefreshTokensCommand,
  RefreshTokensOutput
> {
  private readonly logger = new Logger(RefreshTokensHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepositoryPort,
    private readonly userIntegrationPort: UserIntegrationPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RefreshTokensCommand): Promise<RefreshTokensOutput> {
    let payload: RefreshTokenPayload;
    try {
      // Verify the signature of the refresh token
      payload = await this.tokenService.verifyRefreshToken<RefreshTokenPayload>(
        command.refreshToken,
      );
    } catch {
      throw new InvalidRefreshTokenException('Invalid refresh token signature');
    }

    // Fetch from DB (including soft-deleted for reuse detection)
    const currentTokenEntity =
      await this.authRepository.getRefreshTokenIncludingDeleted(
        payload.jti,
        payload.sub,
      );
    if (!currentTokenEntity) {
      this.logger.error(
        `Error getting refresh token from DB for user ${payload.sub}`,
      );
      throw new InvalidRefreshTokenException();
    }

    // Reuse detection: If token was already revoked, revoke all tokens for this user
    if (currentTokenEntity.deletedAt !== null) {
      this.logger.warn(
        `Revoked refresh token replay detected for user ${payload.sub}. Revoking all sessions.`,
      );
      await this.authRepository.revokeAllRefreshTokens(payload.sub);
      throw new InvalidRefreshTokenException(
        'Revoked token reuse detected; all sessions terminated',
      );
    }

    // Validate against hashed token
    const isRefreshTokenValid = await bcrypt.compare(
      command.refreshToken,
      currentTokenEntity.token,
    );
    if (!isRefreshTokenValid) {
      this.logger.error(
        `Invalid refresh token hash match for user ${payload.sub}`,
      );
      throw new InvalidRefreshTokenException();
    }

    // Retrieve user and role from user service
    const user = await this.userIntegrationPort.getUserById(payload.sub);
    if (!user) {
      this.logger.error(`User ${payload.sub} not found during token refresh`);
      throw new InvalidRefreshTokenException('User not found');
    }

    // Revoke old token
    const tokenToRevoke = this.publisher.mergeObjectContext(currentTokenEntity);
    tokenToRevoke.revoke();

    // Generate and save new tokens
    const accessToken = await this.tokenService.signAccessToken(
      user.id,
      user.role,
    );
    const refreshTokenDto = await this.tokenService.signRefreshToken(user.id);

    const hashedRefreshToken = await bcrypt.hash(
      refreshTokenDto.token,
      this.HASH_SALT,
    );
    const newRefreshTokenEntity = RefreshTokenEntity.create(
      user.id,
      hashedRefreshToken,
      refreshTokenDto.jti,
    );

    const newToken = this.publisher.mergeObjectContext(newRefreshTokenEntity);
    try {
      await this.authRepository.rotateRefreshToken(tokenToRevoke, newToken);
    } catch {
      throw new TokenGenerationException('Failed to save new refresh token');
    }

    tokenToRevoke.commit();
    newToken.commit();

    return {
      accessToken,
      refreshToken: refreshTokenDto.token,
    };
  }
}
