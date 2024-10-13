import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IUserDatabaseProvider,
  USER_DATABASE_PROVIDER,
} from '@domain/user/interfaces/user-database.provider';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { User } from '@domain/user/entities/user.entity';
import { Result } from '@common/result/result';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_DATABASE_PROVIDER)
    private readonly userDatabaseProvider: IUserDatabaseProvider,
  ) {}

  @TryCatch
  async createUser(user: User): Promise<Result<User>> {
    this.logger.log(`Creating a user with email: ${user.email}`);

    const res = await this.userDatabaseProvider.createUser(user);
    if (res.isError()) {
      this.logger.error(
        `Error creating user with email: ${user.email}`,
        res.error.stack,
      );
      return Result.error(res.error);
    }

    this.logger.log(`Created user successfully with email: ${user.email}`);
    return Result.ok(res.value);
  }
}
