import { Injectable } from '@nestjs/common';
import { UserService } from '@shared/user/application/services/user.service';
import {
  SignupUserDto,
  SignupUserResponseDto,
} from '@application/auth/dtos/signup-user.dto';
import { Result } from '@common/result/result';
import { User } from '@shared/user/domain/entities/user.model';
import { AuthService as CoreAuthService } from '@shared/auth/application/services/auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authService: CoreAuthService,
    private readonly userService: UserService,
  ) {}

  async signup(data: SignupUserDto): Promise<Result<SignupUserResponseDto>> {
    // Create a user
    const createUserRes = await this.userService.createUser(
      User.create({
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    );
    if (createUserRes.isError()) return Result.error(createUserRes.error);

    // Create auth tokens for the user
    const createAuthTokensRes = await this.authService.createTokens(
      createUserRes.value.id,
      'USER',
    );
    if (createUserRes.isError()) return Result.error(createUserRes.error);

    return Result.ok({
      id: createUserRes.value.id,
      username: createUserRes.value.username,
      accessToken: createAuthTokensRes.value.accessToken,
      refreshToken: createAuthTokensRes.value.refreshToken,
      createdAt: createUserRes.value.createdAt.toISOString(),
    });
  }
}
