import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { SigninCommand } from './signin.command';
import { Logger } from '@nestjs/common';
import { Result } from '@common/result/result';
import { UserIntegrationPort } from '@auth/application/ports/user-integration.port';
import { SigninResponse } from '@auth/presentation/http/dtos/signin.dto';
import { ErrorCode } from '@common/result/error';
import { TokenService } from '@auth/application/services/token.service';
import { AuthRepositoryPort } from '@auth/application/ports/auth-repository.port';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';
import * as bcrypt from 'bcrypt';

@CommandHandler(SigninCommand)
export class SigninHandler implements ICommandHandler<
  SigninCommand,
  Result<SigninResponse>
> {
  private readonly logger = new Logger(SigninHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    private readonly userIntegrationPort: UserIntegrationPort,
    private readonly tokenService: TokenService,
    private readonly authRepository: AuthRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SigninCommand): Promise<Result<SigninResponse>> {
    //Validate Credentials
    const validateRes = await this.userIntegrationPort.validatePassword(
      command.property,
      command.password,
    );
    if (validateRes.isError()) {
      if (validateRes.error.code == ErrorCode.INTERNAL) {
        return Result.error('Something went wrong. Please try again.');
      }
      return Result.error('Invalid Credentials', ErrorCode.UNAUTHENTICATED);
    }

    const user = validateRes.value;

    // Generate Tokens
    const accessToken = await this.tokenService.signAccessToken(
      user.id,
      user.role,
    );
    const refreshTokenDto = await this.tokenService.signRefreshToken(user.id);

    // Hash Refresh Token and Save
    const hashedRefreshToken = await bcrypt.hash(
      refreshTokenDto.token,
      this.HASH_SALT,
    );
    const refreshTokenEntity = RefreshTokenEntity.create(
      user.id,
      hashedRefreshToken,
      refreshTokenDto.jti,
    );

    const rtDomain = this.publisher.mergeObjectContext(refreshTokenEntity);

    const saveRes = await this.authRepository.save(rtDomain);
    if (saveRes.isError()) {
      this.logger.error(
        `Error saving refresh token during signin for user ${user.id}`,
      );
      return Result.error(
        'Failed to create token; please sign in again',
        ErrorCode.INTERNAL,
      );
    }

    rtDomain.commit();

    return Result.ok({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken: refreshTokenDto.token,
      },
    });
  }
}
