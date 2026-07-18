import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';

@Entity({ schema: 'auth', name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryColumn('uuid')
  id: string;

  @Column({
    type: 'uuid',
  })
  @Index('refresh_tokens_user_id_idx')
  user_id: string;

  @Column({
    type: 'text',
    comment: 'The hashed string of the actual token',
  })
  token: string;

  @Column({
    type: 'varchar',
    comment: 'A unique id to identify the jwt. usually a uuid',
  })
  @Index('refresh_tokens_identifier_uniq', { unique: true })
  identifier: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  static fromDomain(entity: RefreshTokenEntity): RefreshToken {
    if (!entity) return null;

    const refreshTokenEntity = new RefreshToken();

    if (entity.id) {
      refreshTokenEntity.id = entity.id;
    }
    refreshTokenEntity.user_id = entity.userId;
    refreshTokenEntity.token = entity.token;
    refreshTokenEntity.identifier = entity.identifier;
    refreshTokenEntity.created_at = entity.createdAt;
    refreshTokenEntity.updated_at = entity.updatedAt;
    refreshTokenEntity.deleted_at = entity.deletedAt;

    return refreshTokenEntity;
  }

  static toDomain(refreshToken: RefreshToken): RefreshTokenEntity {
    if (!refreshToken) return null;

    return new RefreshTokenEntity(
      refreshToken.id,
      refreshToken.created_at,
      refreshToken.updated_at,
      refreshToken.user_id,
      refreshToken.token,
      refreshToken.identifier,
      refreshToken.deleted_at,
    );
  }
}
