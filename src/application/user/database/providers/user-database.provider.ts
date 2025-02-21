import { Result } from '@common/result/result';
import { UserExistsInput } from '@application/user/database/postgres/services/dto/user-exists.dto';
import { IUser, IUserEntity } from '@application/user/models/user.model';

interface IUserDatabaseReader {
  userExists(data: UserExistsInput): Promise<Result<boolean>>;
}

interface IUserDatabaseWriter {
  createUser(user: IUser): Promise<Result<IUserEntity>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-providers';
