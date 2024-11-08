import { Inject, Injectable, Logger } from '@nestjs/common';

import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import {
  IUserDatabaseProvider,
  USER_DATABASE_PROVIDER,
} from '../../domain/interfaces/user-database.provider';
import { User } from '../../domain/entities/user.model';
import * as crypto from 'node:crypto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(USER_DATABASE_PROVIDER)
    private readonly userDatabaseProvider: IUserDatabaseProvider,
  ) {}

  @TryCatch
  async createUser(user: User): Promise<Result<User>> {
    this.logger.log('Checking if user exists before creating one.');
    // Checking the email
    const emailExists = await this.userDatabaseProvider.userExists({
      email: user.email,
    });
    if (emailExists.isError()) {
      this.logger.error(
        `Error when checking existence of email(${user.email}): ${emailExists.error.message}`,
      );
      return Result.error(emailExists.error);
    }
    if (emailExists.value === true) {
      this.logger.log('User already exists; returning error');
      return Result.error('You info is Duplicate', ErrorCode.DUPLICATE);
    }

    // If user provided a username check for its existence
    if (user.username) {
      const usernameExistsRes = await this.userDatabaseProvider.userExists({
        username: user.username,
      });
      if (usernameExistsRes.isError()) {
        this.logger.error(
          `Error when checking existence of username(${user.username}): ${usernameExistsRes.error.message}`,
        );
        return Result.error(usernameExistsRes.error);
      }
      if (usernameExistsRes.value === true) {
        this.logger.log('User already exists; returning error');
        return Result.error('You info is Duplicate', ErrorCode.DUPLICATE);
      }
    } else {
      do {
        const username = `user_${crypto.randomBytes(10).toString('hex')}`;
        const usernameExistsRes = await this.userDatabaseProvider.userExists({
          username: username,
        });
        if (usernameExistsRes.isOk() && !usernameExistsRes.value) {
          // Set the random username to the user
          user.username = username;

          break;
        }
      } while (true);
    }

    this.logger.log(
      `Creating a user with email: ${user.email} and username: ${user.username}`,
    );
    const createUserRes = await this.userDatabaseProvider.createUser(user);
    if (createUserRes.isError()) {
      this.logger.error(
        `Error creating user with email: ${user.email}: ${createUserRes.error.message}`,
      );
      return Result.error(createUserRes.error);
    }

    this.logger.log(
      `Created user successfully with email: ${user.email} and username: ${user.username}`,
    );
    return Result.ok(createUserRes.value);
  }
}
