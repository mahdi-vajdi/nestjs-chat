import { User } from '@domain/user/entities/user.model';
import { Result } from '@common/result/result';
import { UserExists } from '../../../infrastructure/user/database/postgres/services/dto/user-exists.dto';

interface IUserDatabaseReader {
  userExists(data: UserExists): Promise<Result<boolean>>;
}

interface IUserDatabaseWriter {
  createUser(user: User): Promise<Result<User>>;
}

export interface IUserDatabaseProvider
  extends IUserDatabaseReader,
    IUserDatabaseWriter {}

export const USER_DATABASE_PROVIDER = 'user-database-provider';
