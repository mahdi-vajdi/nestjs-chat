import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AUTH_DATABASE_PROVIDER,
  IAuthDatabaseProvider,
} from '../../domain/interfaces/auth-database.provider';
import { JwtService } from '@nestjs/jwt';
import { AUTH_CONFIG_TOKEN, IAuthConfig } from '../../configs/auth.config';
import { ConfigService } from '@nestjs/config';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { CreateTokensOutput } from './dtos/create-tokens.dto';
import { Result } from '@common/result/result';
import { RefreshToken } from '../../domain/entities/refresh-token.model';
import { AccessTokenPayload } from '../types/access-token-payload.type';
import { RefreshTokensOutput } from './dtos/refresh-tokens.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authConfig: IAuthConfig;

  constructor(
    readonly configService: ConfigService,
    @Inject(AUTH_DATABASE_PROVIDER)
    private readonly authDatabaseProvider: IAuthDatabaseProvider,
    private readonly jwtService: JwtService,
  ) {
    this.authConfig = configService.get<IAuthConfig>(AUTH_CONFIG_TOKEN);
  }

  @TryCatch
  async createTokens(
    userId: string,
    role: string,
  ): Promise<Result<CreateTokensOutput>> {
    const accessToken = await this.signAccessToken(userId, role);
    const refreshToken = await this.signRefreshToken(userId);

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

  @TryCatch
  async verifyAccessToken(
    accessToken: string,
  ): Promise<Result<AccessTokenPayload>> {
    // Verify the access token
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      accessToken,
      {
        publicKey: this.authConfig.accessPublicKey,
      },
    );

    return Result.ok(payload);
  }

  @TryCatch
  async refreshTokens(
    refreshToken: string,
    userRole: string,
  ): Promise<Result<RefreshTokensOutput>> {
    // Verify the refresh token
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      refreshToken,
      {
        publicKey: this.authConfig.accessPublicKey,
      },
    );

    // Check if the refresh token exists in the database
    const getRefreshTokenRes = await this.authDatabaseProvider.getRefreshToken(
      refreshToken,
      payload.userId,
    );
    if (getRefreshTokenRes.isError()) {
      this.logger.error(
        `error getting the refresh token for the user id ${payload.userId} from database: ${getRefreshTokenRes.error}`,
      );
      return Result.error(getRefreshTokenRes.error);
    }

    // Delete the old refresh token
    const deleteRefreshTokenRes =
      await this.authDatabaseProvider.deleteRefreshToken(
        getRefreshTokenRes.value.id,
      );
    if (deleteRefreshTokenRes.isError()) {
      this.logger.error(
        `error deleting refresh token for the user id ${payload.userId} in database: ${deleteRefreshTokenRes.error}`,
      );
      return Result.error(deleteRefreshTokenRes.error);
    }

    // Create the new tokens which also saves the refresh token in the database
    const createTokensRes = await this.createTokens(payload.userId, userRole);
    if (createTokensRes.isError()) {
      this.logger.error(
        `error creating new tokens for the user id ${payload.userId} in database: ${createTokensRes.error}`,
      );

      // As fallback restore the deleted refresh token
      await this.authDatabaseProvider.restoreRefreshToken(
        getRefreshTokenRes.value.id,
      );

      return Result.error(createTokensRes.error);
    }

    return Result.ok({
      accessToken: createTokensRes.value.accessToken,
      refreshToken: createTokensRes.value.refreshToken,
    });
  }

  private async signRefreshToken(userId: string): Promise<string> {
    return await this.jwtService.signAsync(
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

  private async signAccessToken(userId: string, role: string): Promise<string> {
    return await this.jwtService.signAsync(
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
