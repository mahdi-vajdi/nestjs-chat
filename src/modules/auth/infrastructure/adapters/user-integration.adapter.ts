import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  UserIntegrationPort,
} from '@auth/application/ports/user-integration.port';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '@user/application/commands/create-user/create-user.command';
import { ValidatePasswordQuery } from '@user/application/queries/validate-password/validate-password.query';
import { Result } from '@common/result/result';

@Injectable()
export class UserIntegrationAdapter implements UserIntegrationPort {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createUser(data: any): Promise<Result<AuthUser>> {
    const res = await this.commandBus.execute(
      new CreateUserCommand(
        data.email,
        data.username,
        data.password,
        data.firstName,
        data.lastName,
        data.avatar,
      ),
    );
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
    const res = await this.queryBus.execute(
      new ValidatePasswordQuery(property, password),
    );
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
