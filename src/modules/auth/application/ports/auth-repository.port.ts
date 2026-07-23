import { RefreshTokenEntity } from '@modules/auth/domain/models/refresh-token.entity';

export abstract class AuthRepositoryPort {
  abstract getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<RefreshTokenEntity | null>;
  abstract save(entity: RefreshTokenEntity): Promise<RefreshTokenEntity>;
}
