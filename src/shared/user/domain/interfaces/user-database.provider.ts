import { Result } from '@common/result/result';
import { UserExistsInput } from '../../infrastructure/database/postgres/services/dto/user-exists.dto';
import { User } from '../entities/user.model';

interface IUserDatabaseReader {
  userExists(data: UserExistsInput): Promise<Result<boolean>>;
}

interface IUserDatabaseWriter {
  createUser(user: User): Promise<Result<User>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-provider';
