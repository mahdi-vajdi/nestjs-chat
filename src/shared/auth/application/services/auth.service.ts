import { Injectable, Logger } from '@nestjs/common';
import { IAuthDatabaseProvider } from '../../domain/interfaces/auth-database.provider';
import { JwtService } from '@nestjs/jwt';
import { AUTH_CONFIG_TOKEN, IAuthConfig } from '../../configs/auth.config';
import { ConfigService } from '@nestjs/config';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { CreateTokensDto } from './dtos/create-tokens.dto';
import { Result } from '@common/result/result';
import { RefreshToken } from '../../domain/entities/refresh-token.model';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authConfig: IAuthConfig;

  constructor(
    readonly configService: ConfigService,
    private readonly authDatabaseProvider: IAuthDatabaseProvider,
    private readonly jwtService: JwtService,
  ) {
    this.authConfig = configService.get<IAuthConfig>(AUTH_CONFIG_TOKEN);
  }

  @TryCatch
  async createTokens(
    userId: string,
    role: string,
  ): Promise<Result<CreateTokensDto>> {
    const accessToken = this.signAccessToken(userId, role);
    const refreshToken = this.signRefreshToken(userId);

    const saveRefreshTokenRes =
      await this.authDatabaseProvider.createRefreshToken(
        RefreshToken.create({
          token: refreshToken,
          userId: userId,
        }),
      );
    if (saveRefreshTokenRes.isError()) {
      this.logger.error(
        `error creating refresh token for the user id ${userId} in database: ${saveRefreshTokenRes.error}`,
      );
      return Result.error(saveRefreshTokenRes.error);
    }

    return Result.ok({
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  }

  private signRefreshToken(userId: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
      },
      {
        privateKey: this.authConfig.refreshPrivateKey,
        expiresIn: '7d',
        // jwtid: '' // TODO: utilize jti for blacklisting
      },
    );
  }

  private signAccessToken(userId: string, role: string): string {
    return this.jwtService.sign(
      {
        sub: userId,
        scope: role,
      },
      {
        privateKey: this.authConfig.accessPrivateKey,
        expiresIn: '1h',
      },
    );
  }
}
