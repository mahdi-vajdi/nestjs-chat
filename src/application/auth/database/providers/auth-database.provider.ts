import { Result } from '@common/result/result';
import {
  IRefreshToken,
  IRefreshTokenEntity,
} from '@auth/models/refresh-token.model';

interface IAuthDatabaseReader {
  getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<IRefreshTokenEntity>>;
}

interface IAuthDatabaseWriter {
  createRefreshToken(
    refreshToken: IRefreshToken,
  ): Promise<Result<IRefreshTokenEntity>>;

  deleteRefreshToken(id: string): Promise<Result<boolean>>;

  restoreRefreshToken(id: string): Promise<Result<boolean>>;
}

export interface IAuthDatabaseProvider
  extends IAuthDatabaseReader,
    IAuthDatabaseWriter {}

export const AUTH_DATABASE_PROVIDER = 'auth-database-providers';
