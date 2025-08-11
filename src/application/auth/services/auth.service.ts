import { Inject, Injectable, Logger } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { CreateTokensOutput } from './dtos/create-tokens.dto';
import { Result } from '@common/result/result';
import { AccessTokenPayload } from '../types/access-token-payload.type';
import { RefreshTokensOutput } from './dtos/refresh-tokens.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';
import { ErrorCode } from '@common/result/error';
import {
  AUTH_DATABASE_PROVIDER,
  IAuthDatabaseProvider,
} from '@auth/database/providers/auth-database.provider';
import { AUTH_CONFIG_TOKEN, IAuthConfig } from '@auth/configs/auth.config';
import { RefreshTokenPayload } from '@auth/types/refresh-token-payload.type';
import { SignRefreshTokenOutput } from '@auth/services/dtos/sign-refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authConfig: IAuthConfig;

  private readonly HASH_SALT = 10;

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

    // Save the hashed refresh token in the database
    const hashedRefreshToken = await bcrypt.hash(
      refreshToken.token,
      this.HASH_SALT,
    );
    const saveRefreshTokenRes =
      await this.authDatabaseProvider.createRefreshToken({
        userId: userId,
        token: hashedRefreshToken,
        identifier: refreshToken.jti,
      });
    if (saveRefreshTokenRes.isError()) {
      this.logger.error(
        `error creating refresh token for the user id ${userId} in database: ${saveRefreshTokenRes.error}`,
      );
      return Result.error(saveRefreshTokenRes.error);
    }

    return Result.ok({
      accessToken: accessToken,
      refreshToken: refreshToken.token,
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
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      refreshToken,
      {
        publicKey: this.authConfig.refreshPublicKey,
      },
    );

    // Get the refresh token from database
    const getRefreshTokenRes = await this.authDatabaseProvider.getRefreshToken(
      payload.jti,
      payload.userId,
    );
    if (getRefreshTokenRes.isError()) {
      this.logger.error(
        `error getting the refresh token for the user id ${payload.userId} from database: ${getRefreshTokenRes.error}`,
      );
      return Result.error(getRefreshTokenRes.error);
    }

    // Compare the given refresh token with saved hash in the database
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      getRefreshTokenRes.value.token,
    );
    if (!isRefreshTokenValid) {
      this.logger.error(
        `invalid refresh token for the user id ${payload.userId}`,
      );
      return Result.error('Invalid refresh token', ErrorCode.INVALID_ARGUMENT);
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

  private async signRefreshToken(
    userId: string,
  ): Promise<SignRefreshTokenOutput> {
    const jti = uuidV4(); // Used as identifier for the jwt
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        privateKey: this.authConfig.refreshPrivateKey,
        expiresIn: '7d',
        jwtid: jti,
      },
    );

    return {
      token: token,
      jti: jti,
    };
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
