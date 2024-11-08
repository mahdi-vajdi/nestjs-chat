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
    const res = await this.userService.createUser(
      User.create({
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    );
    if (res.isError()) return Result.error(res.error);

    return Result.ok({
      id: res.value.id,
      createdAt: res.value.createdAt.toISOString(),
    });
  }
}
