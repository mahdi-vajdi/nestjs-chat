import { Result } from '@common/result/result';
import {
  RefreshTokenEntity,
  RefreshTokenProps,
} from '@auth/models/refresh-token.props';

interface IAuthDatabaseReader {
  getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshTokenEntity>>;
}

interface IAuthDatabaseWriter {
  createRefreshToken(
    props: RefreshTokenProps,
  ): Promise<Result<RefreshTokenEntity>>;

  deleteRefreshToken(id: string): Promise<Result<boolean>>;

  restoreRefreshToken(id: string): Promise<Result<boolean>>;
}

export interface IAuthDatabaseProvider
  extends IAuthDatabaseReader,
    IAuthDatabaseWriter {}

export const AUTH_DATABASE_PROVIDER = 'auth-database-providers';
