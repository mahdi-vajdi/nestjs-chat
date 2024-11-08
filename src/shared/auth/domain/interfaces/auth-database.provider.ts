import { RefreshToken } from '../entities/refresh-token.model';
import { Result } from '@common/result/result';

interface IAuthDatabaseReader {}

interface IAuthDatabaseWriter {
  createRefreshToken(refreshToken: RefreshToken): Promise<Result<RefreshToken>>;
}

export interface IAuthDatabaseProvider
  extends IAuthDatabaseReader,
    IAuthDatabaseWriter {}

export const AUTH_DATABASE_PROVIDER = 'auth-database-provider';
