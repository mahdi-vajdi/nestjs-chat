import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RefreshTokensCommand } from './refresh-tokens.command';
import { Logger } from '@nestjs/common';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { TokenService } from '@auth/application/services/token.service';
import { AuthRepositoryPort } from '@auth/application/ports/auth-repository.port';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';
import { RefreshTokensOutput } from '@auth/application/services/dtos/refresh-tokens.dto';
import { RefreshTokenPayload } from '@auth/domain/types/refresh-token-payload.type';
import * as bcrypt from 'bcrypt';

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensHandler implements ICommandHandler<
  RefreshTokensCommand,
  Result<RefreshTokensOutput>
> {
  private readonly logger = new Logger(RefreshTokensHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(
    command: RefreshTokensCommand,
  ): Promise<Result<RefreshTokensOutput>> {
    let payload: RefreshTokenPayload;
    try {
      // Verify the signature of the refresh token
      payload = await this.tokenService.verifyRefreshToken<RefreshTokenPayload>(
        command.refreshToken,
      );
    } catch {
      return Result.error(
        'Invalid refresh token signature',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    // Fetch from DB
    const getRefreshTokenRes = await this.authRepository.getRefreshToken(
      payload.jti,
      payload.sub,
    );
    if (getRefreshTokenRes.isError()) {
      this.logger.error(
        `Error getting refresh token from DB for user ${payload.sub}`,
      );
      return Result.error(getRefreshTokenRes.error);
    }

    const currentTokenEntity = getRefreshTokenRes.value;

    // Validate against hashed token
    const isRefreshTokenValid = await bcrypt.compare(
      command.refreshToken,
      currentTokenEntity.token,
    );
    if (!isRefreshTokenValid) {
      this.logger.error(
        `Invalid refresh token hash match for user ${payload.sub}`,
      );
      return Result.error('Invalid refresh token', ErrorCode.INVALID_ARGUMENT);
    }

    // Revoke/Delete old token
    const tokenToRevoke = this.publisher.mergeObjectContext(currentTokenEntity);
    tokenToRevoke.softDelete();

    const deleteRes = await this.authRepository.save(tokenToRevoke);
    if (deleteRes.isError()) {
      return Result.error(deleteRes.error);
    }

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
    const saveNewRes = await this.authRepository.save(newToken);
    if (saveNewRes.isError()) {
      // Fallback: restore the old one (as in original logic)
      tokenToRevoke.restore();
      await this.authRepository.save(tokenToRevoke);
      return Result.error(saveNewRes.error);
    }

    tokenToRevoke.commit();
    newToken.commit();

    return Result.ok({
      accessToken,
      refreshToken: refreshTokenDto.token,
    });
  }
}
