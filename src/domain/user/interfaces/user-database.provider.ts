import { User } from '@domain/user/entities/user.model';
import { Result } from '@common/result/result';

interface IUserDatabaseReader {}

interface IUserDatabaseWriter {
  createUser(user: User): Promise<Result<User>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-provider';
