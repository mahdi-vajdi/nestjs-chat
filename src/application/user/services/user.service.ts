import { Inject, Injectable, Logger } from '@nestjs/common';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import {
  IUserDatabaseProvider,
  USER_DATABASE_PROVIDER,
} from '@user/database/providers/user-database.provider';
import { UserEntity, UserProps } from '@user/models/user.model';
import validator from 'validator';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private readonly HASH_SALT = 10;

  constructor(
    @Inject(USER_DATABASE_PROVIDER)
    private readonly userDatabaseProvider: IUserDatabaseProvider,
  ) {}

  @TryCatch
  async createUser(user: UserProps): Promise<Result<UserEntity>> {
    this.logger.debug('Checking if user exists before creating one.');
    // Checking the email
    const emailExists = await this.userDatabaseProvider.userExists({
      email: user.email,
    });
    if (emailExists.isError()) {
      return Result.error(emailExists.error);
    }
    if (emailExists.value === true) {
      this.logger.log(
        `User with email ${user.email} already exists; returning error`,
      );
      return Result.error('You email is Duplicate', ErrorCode.ALREADY_EXISTS);
    }

    // If user provided a username check for its existence
    if (user.username) {
      const usernameExistsRes = await this.userDatabaseProvider.userExists({
        username: user.username,
      });
      if (usernameExistsRes.isError()) {
        return Result.error(usernameExistsRes.error);
      }
      if (usernameExistsRes.value === true) {
        this.logger.log(
          `User with username ${user.username} already exists; returning error`,
        );
        return Result.error(
          'You username is Duplicate',
          ErrorCode.ALREADY_EXISTS,
        );
      }
    } else {
      do {
        const username = `user_${crypto.randomBytes(5).toString('hex')}`;
        const usernameExistsRes = await this.userDatabaseProvider.userExists({
          username: username,
        });
        if (usernameExistsRes.isError()) {
          return Result.error('Error generating username', ErrorCode.INTERNAL);
        }
        if (usernameExistsRes.value === false) {
          // Set the random username to the user
          user.username = username;

          break;
        }
      } while (true);
    }

    this.logger.debug(
      `Creating a user with email: ${user.email} and username: ${user.username}`,
    );
    // Hash the password for the user
    user.password = await bcrypt.hash(user.password, this.HASH_SALT);

    // Save the validated and modified user in the database
    const createUserRes = await this.userDatabaseProvider.createUser(user);
    if (createUserRes.isError()) {
      return Result.error(createUserRes.error);
    }

    this.logger.log(
      `Created user successfully with email: ${user.email} and username: ${user.username}`,
    );
    return Result.ok(createUserRes.value);
  }

  @TryCatch
  async getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>> {
    const res =
      await this.userDatabaseProvider.getUserIdsByNameOrUsername(
        nameOrUsernameFilter,
      );
    if (res.isError()) {
      return Result.error(res.error);
    }

    this.logger.debug(
      `Fetched ${res.value.length} ids from users with filter: ${nameOrUsernameFilter}`,
    );
    return Result.ok(res.value);
  }

  @TryCatch
  async getUserById(id: string): Promise<Result<UserEntity>> {
    const res = await this.userDatabaseProvider.getUserById(id);
    if (res.isError()) {
      this.logger.error(`Failed to get user by id ${id}: ${res.error.message}`);
      return Result.error(res.error);
    }

    return Result.ok(res.value);
  }

  @TryCatch
  async getUsersByIds(userIds: string[]): Promise<Result<UserEntity[]>> {
    const res = await this.userDatabaseProvider.getUsersByIds(userIds);
    if (res.isError()) {
      return Result.error(res.error);
    }

    return Result.ok(res.value);
  }

  /**
   * @param property email or username
   * @param password The user's input password
   * @returns {UserEntity} if the password is valid
   */
  @TryCatch
  async validatePassword(
    property: string,
    password: string,
  ): Promise<Result<UserEntity>> {
    let userRes: Result<UserEntity>;

    const isEmail = validator.isEmail(property);
    if (isEmail) {
      userRes = await this.userDatabaseProvider.getUserByEmail(property);
    } else {
      userRes = await this.userDatabaseProvider.getUserByUsername(property);
    }
    if (userRes.isError()) {
      this.logger.error(
        `Failed to get user by property ${property}: ${userRes.error.message}`,
      );
      return Result.error(userRes.error);
    }

    const passwordMatches = await bcrypt.compare(
      password,
      userRes.value.password,
    );
    if (!passwordMatches) {
      return Result.error(
        'Username or password is combination is invalid',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    return Result.ok(userRes.value);
  }

  @TryCatch
  async block(userId: string, targetUserId: string): Promise<Result<boolean>> {
    this.logger.debug(`User ${userId} is blocking ${targetUserId}`);

    const res = await this.userDatabaseProvider.block(userId, targetUserId);
    if (res.isError()) {
      return Result.error(res.error);
    }

    if (res.value == false) {
      this.logger.log(
        `User ${userId} has already blocked user ${targetUserId}`,
      );
    }

    return Result.ok(res.value);
  }

  @TryCatch
  async unblock(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>> {
    this.logger.debug(`User ${userId} is unblocking ${targetUserId}`);
    const res = await this.userDatabaseProvider.unblock(userId, targetUserId);
    if (res.isError()) {
      return Result.error(res.error);
    }

    if (res.value == false) {
      this.logger.log(`User ${targetUserId} was not blocked by ${userId}`);
    }

    return Result.ok(res.value);
  }
}
