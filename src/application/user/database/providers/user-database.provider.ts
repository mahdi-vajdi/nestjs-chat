import { Result } from '@common/result/result';
import { User } from '@user/models/user.entity';
import { UserExistsQueryable } from '@user/database/postgres/queryables/user-exists.queryable';

interface IUserDatabaseReader {
  userExists(data: UserExistsQueryable): Promise<Result<boolean>>;
}

interface IUserDatabaseWriter {
  createUser(user: User): Promise<Result<User>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-providers';
