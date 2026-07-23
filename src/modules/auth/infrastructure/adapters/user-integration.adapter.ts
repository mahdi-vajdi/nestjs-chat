import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  UserIntegrationPort,
} from '@auth/application/ports/user-integration.port';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '@user/application/commands/create-user/create-user.command';
import { ValidatePasswordQuery } from '@user/application/queries/validate-password/validate-password.query';

@Injectable()
export class UserIntegrationAdapter implements UserIntegrationPort {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createUser(data: any): Promise<AuthUser> {
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
    return {
      id: res.id,
      role: res.role,
      firstName: res.firstName,
      lastName: res.lastName,
      createdAt: res.createdAt,
    };
  }

  async validatePassword(
    property: string,
    password: string,
  ): Promise<AuthUser> {
    const res = await this.queryBus.execute(
      new ValidatePasswordQuery(property, password),
    );
    return {
      id: res.id,
      role: res.role,
      firstName: res.firstName,
      lastName: res.lastName,
      createdAt: res.createdAt,
    };
  }
}
