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

    // Fetch from DB
    const currentTokenEntity = await this.authRepository.getRefreshToken(
      payload.jti,
      payload.sub,
    );
    if (!currentTokenEntity) {
      this.logger.error(
        `Error getting refresh token from DB for user ${payload.sub}`,
      );
      throw new InvalidRefreshTokenException();
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

    // Revoke/Delete old token
    const tokenToRevoke = this.publisher.mergeObjectContext(currentTokenEntity);
    tokenToRevoke.softDelete();

    await this.authRepository.save(tokenToRevoke);

    // Generate and save new tokens
    const accessToken = await this.tokenService.signAccessToken(
      payload.sub,
      command.userRole,
    );
    const refreshTokenDto = await this.tokenService.signRefreshToken(
      payload.sub,
    );

    const hashedRefreshToken = await bcrypt.hash(
      refreshTokenDto.token,
      this.HASH_SALT,
    );
    const newRefreshTokenEntity = RefreshTokenEntity.create(
      payload.sub,
      hashedRefreshToken,
      refreshTokenDto.jti,
    );

    const newToken = this.publisher.mergeObjectContext(newRefreshTokenEntity);
    try {
      await this.authRepository.save(newToken);
    } catch {
      // Fallback: restore the old one (as in original logic)
      tokenToRevoke.restore();
      await this.authRepository.save(tokenToRevoke);
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
