import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './logout.command';
import { Logger } from '@nestjs/common';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { TokenService } from '@modules/auth/application/services/token.service';
import { RefreshTokenPayload } from '@modules/auth/domain/types/refresh-token-payload.type';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand, boolean> {
  private readonly logger = new Logger(LogoutHandler.name);

  constructor(
    private readonly authRepository: AuthRepositoryPort,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand): Promise<boolean> {
    const { userId, refreshToken, allDevices } = command;

    if (allDevices || !refreshToken) {
      this.logger.log(`Logging out all devices for user ${userId}`);
      return this.authRepository.revokeAllRefreshTokens(userId);
    }

    try {
      const payload =
        await this.tokenService.verifyRefreshToken<RefreshTokenPayload>(
          refreshToken,
        );
      this.logger.log(`Logging out session ${payload.jti} for user ${userId}`);
      return this.authRepository.revokeRefreshToken(payload.jti, userId);
    } catch {
      this.logger.warn(
        `Invalid refresh token provided during logout for user ${userId}. Revoking all tokens as safety fallback.`,
      );
      return this.authRepository.revokeAllRefreshTokens(userId);
    }
  }
}
