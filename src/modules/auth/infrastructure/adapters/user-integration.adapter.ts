import { Injectable } from '@nestjs/common';
import {
  UserIntegrationPort,
  AuthUser,
} from '@auth/application/ports/user-integration.port';
import { UserService } from '@user/application/services/user.service';
import { Result } from '@common/result/result';

@Injectable()
export class UserIntegrationAdapter implements UserIntegrationPort {
  constructor(private readonly userService: UserService) {}

  async createUser(data: any): Promise<Result<AuthUser>> {
    const res = await this.userService.createUser(data);
    if (res.isError()) return Result.error(res.error);
    return Result.ok({
      id: res.value.id,
      role: res.value.role,
      firstName: res.value.firstName,
      lastName: res.value.lastName,
      createdAt: res.value.createdAt,
    });
  }

  async validatePassword(
    property: string,
    password: string,
  ): Promise<Result<AuthUser>> {
    const res = await this.userService.validatePassword(property, password);
    if (res.isError()) return Result.error(res.error);
    return Result.ok({
      id: res.value.id,
      role: res.value.role,
      firstName: res.value.firstName,
      lastName: res.value.lastName,
      createdAt: res.value.createdAt,
    });
  }
}
