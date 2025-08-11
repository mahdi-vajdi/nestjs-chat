import { Result } from '@common/result/result';
import { UserEntity, UserProps } from '@user/models/user.model';
import { UserExistsQueryable } from '@user/database/postgres/queryables/user-exists.queryable';

interface IUserDatabaseReader {
  userExists(data: UserExistsQueryable): Promise<Result<boolean>>;
}

interface IUserDatabaseWriter {
  createUser(user: UserProps): Promise<Result<UserEntity>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-providers';
