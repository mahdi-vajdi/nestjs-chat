import { Result } from '@common/result/result';
import { IUser, IUserEntity } from '@application/user/models/user.model';
import { UserExistsQueryable } from '@application/user/database/postgres/queryables/user-exists.queryable';

interface IUserDatabaseReader {
  userExists(data: UserExistsQueryable): Promise<Result<boolean>>;
}

interface IUserDatabaseWriter {
  createUser(user: IUser): Promise<Result<IUserEntity>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-providers';
