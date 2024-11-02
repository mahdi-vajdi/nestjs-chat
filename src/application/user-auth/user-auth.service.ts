import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/application/services/user.service';
import {
  SignupUserDto,
  SignupUserResponseDto,
} from '@application/user-auth/dtos/signup-user.dto';
import { Result } from '@common/result/result';
import { User } from '../../user/domain/entities/user.model';

@Injectable()
export class UserAuthService {
  constructor(private readonly userService: UserService) {}

  async signupUser(
    data: SignupUserDto,
  ): Promise<Result<SignupUserResponseDto>> {
    const res = await this.userService.createUser(
      User.create({
        email: data.email,
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
