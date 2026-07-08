import { Result } from '@common/result/result';
import {
  RefreshTokenEntity,
  RefreshTokenProps,
} from '@auth/domain/models/refresh-token.props';

interface AuthDatabaseReader {
  getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshTokenEntity>>;
}

interface AuthDatabaseWriter {
  createRefreshToken(
    props: RefreshTokenProps,
  ): Promise<Result<RefreshTokenEntity>>;

  deleteRefreshToken(id: string): Promise<Result<boolean>>;

  restoreRefreshToken(id: string): Promise<Result<boolean>>;
}

export interface AuthRepositoryPort
  extends AuthDatabaseReader, AuthDatabaseWriter {}

export const AUTH_REPOSITORY_PORT = 'auth-database-providers';
