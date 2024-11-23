import { RefreshToken } from '../entities/refresh-token.model';
import { Result } from '@common/result/result';

interface IAuthDatabaseReader {
  getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshToken>>;
}

interface IAuthDatabaseWriter {
  createRefreshToken(refreshToken: RefreshToken): Promise<Result<RefreshToken>>;

  deleteRefreshToken(id: string): Promise<Result<boolean>>;

  restoreRefreshToken(id: string): Promise<Result<boolean>>;
}

export interface IAuthDatabaseProvider
  extends IAuthDatabaseReader,
    IAuthDatabaseWriter {}

export const AUTH_DATABASE_PROVIDER = 'auth-database-provider';
