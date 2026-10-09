import { RefreshTokenEntity } from '@modules/auth/domain/models/refresh-token.entity';

export abstract class AuthRepositoryPort {
  abstract getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<RefreshTokenEntity | null>;
  abstract getRefreshTokenIncludingDeleted(
    identifier: string,
    userId: string,
  ): Promise<RefreshTokenEntity | null>;
  abstract save(entity: RefreshTokenEntity): Promise<RefreshTokenEntity>;
  abstract rotateRefreshToken(
    oldToken: RefreshTokenEntity,
    newToken: RefreshTokenEntity,
  ): Promise<void>;
  abstract revokeRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<boolean>;
  abstract revokeAllRefreshTokens(userId: string): Promise<boolean>;
}
