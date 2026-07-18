import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { SignupCommand } from './signup.command';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result/result';
import { UserIntegrationPort } from '@auth/application/ports/user-integration.port';
import { SignupResponse } from '@auth/presentation/http/dtos/signup.dto';
import { ErrorCode } from '@common/result/error';
import { TokenService } from '@auth/application/services/token.service';
import {
  AUTH_REPOSITORY_PORT,
  AuthRepositoryPort,
} from '@auth/application/ports/auth-repository.port';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';
import * as bcrypt from 'bcrypt';

@CommandHandler(SignupCommand)
export class SignupHandler implements ICommandHandler<
  SignupCommand,
  Result<SignupResponse>
> {
  private readonly logger = new Logger(SignupHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    private readonly userIntegrationPort: UserIntegrationPort,
    private readonly tokenService: TokenService,
    @Inject(AUTH_REPOSITORY_PORT)
    private readonly authRepository: AuthRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SignupCommand): Promise<Result<SignupResponse>> {
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

    if (createUserRes.isError()) {
      return Result.error(createUserRes.error);
    }

    const userId = createUserRes.value.id;

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

    const saveRes = await this.authRepository.save(refreshToken);
    if (saveRes.isError()) {
      this.logger.error(
        `Error saving refresh token during signup for user ${userId}`,
      );
      return Result.error(
        'Failed to create token; please sign in again',
        ErrorCode.INTERNAL,
      );
    }

    refreshToken.commit();

    return Result.ok({
      id: userId,
      accessToken,
      refreshToken: refreshTokenDto.token,
      createdAt: createUserRes.value.createdAt.toISOString(),
    });
  }
}
