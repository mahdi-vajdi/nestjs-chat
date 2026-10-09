import { Injectable } from '@nestjs/common';
import {
  AuthUser,
  UserIntegrationPort,
} from '@modules/auth/application/ports/user-integration.port';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '@modules/user/application/commands/create-user/create-user.command';
import { ValidatePasswordQuery } from '@modules/user/application/queries/validate-password/validate-password.query';
import { GetUserByIdQuery } from '@modules/user/application/queries/get-user-by-id/get-user-by-id.query';

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

  async getUserById(userId: string): Promise<AuthUser | null> {
    const res = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!res) {
      return null;
    }
    return {
      id: res.id,
      role: res.role,
      firstName: res.firstName,
      lastName: res.lastName,
      createdAt: res.createdAt,
    };
  }
}
