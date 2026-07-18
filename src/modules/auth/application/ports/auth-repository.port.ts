import { Result } from '@common/result/result';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';

interface AuthDatabaseReader {
  getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshTokenEntity>>;
}

interface AuthDatabaseWriter {
  save(entity: RefreshTokenEntity): Promise<Result<RefreshTokenEntity>>;
}

export interface AuthRepositoryPort
  extends AuthDatabaseReader, AuthDatabaseWriter {}

export const AUTH_REPOSITORY_PORT = 'auth-database-providers';
