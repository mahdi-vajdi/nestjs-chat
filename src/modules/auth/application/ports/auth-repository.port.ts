import { Result } from '@common/result/result';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';

export abstract class AuthRepositoryPort {
  abstract getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshTokenEntity>>;
  abstract save(
    entity: RefreshTokenEntity,
  ): Promise<Result<RefreshTokenEntity>>;
}
