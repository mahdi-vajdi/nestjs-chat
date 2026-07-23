import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { SignupCommand } from './signup.command';
import { Logger } from '@nestjs/common';

import { TokenService } from '@modules/auth/application/services/token.service';
import { AuthRepositoryPort } from '@modules/auth/application/ports/auth-repository.port';
import { RefreshTokenEntity } from '@modules/auth/domain/models/refresh-token.entity';
import { UserIntegrationPort } from '@modules/auth/application/ports/user-integration.port';
import { SignupResponse } from '@modules/auth/presentation/http/dtos/signup.dto';
import * as bcrypt from 'bcrypt';

import { TokenGenerationException } from '@modules/auth/domain/auth.exceptions';

@CommandHandler(SignupCommand)
export class SignupHandler implements ICommandHandler<
  SignupCommand,
  SignupResponse
> {
  private readonly logger = new Logger(SignupHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    private readonly userIntegrationPort: UserIntegrationPort,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SignupCommand): Promise<SignupResponse> {
    // Create the User
    const createUserRes = await this.userIntegrationPort.createUser({
      email: command.email,
      username: null,
      password: command.password,
      firstName: command.firstName,
      lastName: command.lastName,
      avatar: null,
      role: 'USER',
    });

    const userId = createUserRes.id;

    // Generate Tokens
    const accessToken = await this.tokenService.signAccessToken(userId, 'USER');
    const refreshTokenDto = await this.tokenService.signRefreshToken(userId);

    // Hash Refresh Token and Save
    const hashedRefreshToken = await bcrypt.hash(
      refreshTokenDto.token,
      this.HASH_SALT,
    );
    const refreshTokenEntity = RefreshTokenEntity.create(
      userId,
      hashedRefreshToken,
      refreshTokenDto.jti,
    );

    const refreshToken = this.publisher.mergeObjectContext(refreshTokenEntity);

    try {
      await this.authRepository.save(refreshToken);
    } catch {
      this.logger.error(
        `Error saving refresh token during signup for user ${userId}`,
      );
      throw new TokenGenerationException(
        'Failed to create token; please sign in again',
      );
    }

    refreshToken.commit();

    return {
      id: userId,
      accessToken,
      refreshToken: refreshTokenDto.token,
      createdAt: createUserRes.createdAt.toISOString(),
    };
  }
}
