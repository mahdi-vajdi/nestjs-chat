import { Inject, Injectable, Logger } from '@nestjs/common';
import { UserIntegrationPort } from '@auth/application/ports/user-integration.port';
import {
  SignupRequestBody,
  SignupResponse,
} from '@auth/presentation/http/dtos/signup.dto';
import {
  SigninRequestBody,
  SigninResponse,
} from '@auth/presentation/http/dtos/signin.dto';
import { ErrorCode } from '@common/result/error';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { CreateTokensOutput } from './dtos/create-tokens.dto';
import { Result } from '@common/result/result';
import { AccessTokenPayload } from '../../domain/types/access-token-payload.type';
import { RefreshTokensOutput } from './dtos/refresh-tokens.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidV4 } from 'uuid';
import {
  AUTH_REPOSITORY_PORT,
  AuthRepositoryPort,
} from '@auth/application/ports/auth-repository.port';
import {
  AUTH_CONFIG_TOKEN,
  IAuthConfig,
} from '@auth/infrastructure/configs/auth.config';
import { RefreshTokenPayload } from '@auth/domain/types/refresh-token-payload.type';
import { SignRefreshTokenOutput } from '@auth/application/services/dtos/sign-refresh-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly authConfig: IAuthConfig;

  private readonly HASH_SALT = 10;

  constructor(
    readonly configService: ConfigService,
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly authDatabaseProvider: AuthRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly userIntegrationPort: UserIntegrationPort,
  ) {
    this.authConfig = configService.get<IAuthConfig>(AUTH_CONFIG_TOKEN);
  }

  async signup(body: SignupRequestBody): Promise<Result<SignupResponse>> {
    const createUserRes = await this.userIntegrationPort.createUser({
      email: body.email,
      username: null,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      avatar: null,
      role: 'USER',
    });

    if (createUserRes.isError()) {
      return Result.error(createUserRes.error);
    }

    const createAuthTokensRes = await this.createTokens(
      createUserRes.value.id,
      'USER',
    );
    if (createAuthTokensRes.isError()) {
      return Result.error(
        'Failed to create token; please sign in again',
        ErrorCode.INTERNAL,
      );
    }

    return Result.ok({
      id: createUserRes.value.id,
      accessToken: createAuthTokensRes.value.accessToken,
      refreshToken: createAuthTokensRes.value.refreshToken,
      createdAt: createUserRes.value.createdAt.toISOString(),
    });
  }

  async signin(body: SigninRequestBody): Promise<Result<SigninResponse>> {
    const validateRes = await this.userIntegrationPort.validatePassword(
      body.property,
      body.password,
    );
    if (validateRes.isError()) {
      if (validateRes.error.code == ErrorCode.INTERNAL) {
        return Result.error('Something went wrong. Please try again.');
      }
      return Result.error('Invalid Credentials', ErrorCode.UNAUTHENTICATED);
    }

    const tokensRes = await this.createTokens(
      validateRes.value.id,
      validateRes.value.role,
    );
    if (tokensRes.isError()) {
      return Result.error(tokensRes.error);
    }

    return Result.ok({
      user: {
        id: validateRes.value.id,
        firstName: validateRes.value.firstName,
        lastName: validateRes.value.lastName,
        createdAt: validateRes.value.createdAt.toISOString(),
      },
      tokens: {
        accessToken: tokensRes.value.accessToken,
        refreshToken: tokensRes.value.refreshToken,
      },
    });
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
    const payload = await this.jwtService.verifyAsync(accessToken, {
      publicKey: this.authConfig.accessPublicKey,
    });

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
      payload.sub,
    );
    if (getRefreshTokenRes.isError()) {
      this.logger.error(
        `error getting the refresh token for the user id ${payload.sub} from database: ${getRefreshTokenRes.error}`,
      );
      return Result.error(getRefreshTokenRes.error);
    }

    // Compare the given refresh token with saved hash in the database
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      getRefreshTokenRes.value.token,
    );
    if (!isRefreshTokenValid) {
      this.logger.error(`invalid refresh token for the user id ${payload.sub}`);
      return Result.error('Invalid refresh token', ErrorCode.INVALID_ARGUMENT);
    }

    // Delete the old refresh token
    const deleteRefreshTokenRes =
      await this.authDatabaseProvider.deleteRefreshToken(
        getRefreshTokenRes.value.id,
      );
    if (deleteRefreshTokenRes.isError()) {
      this.logger.error(
        `error deleting refresh token for the user id ${payload.sub} in database: ${deleteRefreshTokenRes.error}`,
      );
      return Result.error(deleteRefreshTokenRes.error);
    }

    // Create the new tokens which also saves the refresh token in the database
    const createTokensRes = await this.createTokens(payload.sub, userRole);
    if (createTokensRes.isError()) {
      this.logger.error(
        `error creating new tokens for the user id ${payload.sub} in database: ${createTokensRes.error}`,
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
        role: role,
      },
      {
        privateKey: this.authConfig.accessPrivateKey,
        expiresIn: '1d',
      },
    );
  }
}
