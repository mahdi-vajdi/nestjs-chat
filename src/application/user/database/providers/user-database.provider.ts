import { Result } from '@common/result/result';
import { UserEntity, UserProps } from '@user/models/user.model';
import { UserExistsOptions } from '@user/database/options/user-exists.options';

interface IUserDatabaseReader {
  userExists(data: UserExistsOptions): Promise<Result<boolean>>;

  getUsersByIds(userIds: string[]): Promise<Result<UserEntity[]>>;

  getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>>;

  getUserByEmail(email: string): Promise<Result<UserEntity>>;

  getUserByUsername(username: string): Promise<Result<UserEntity>>;
}

interface IUserDatabaseWriter {
  createUser(user: UserProps): Promise<Result<UserEntity>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-providers';
