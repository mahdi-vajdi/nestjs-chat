import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  RefreshTokenEntity,
  RefreshTokenProps,
} from '@auth/models/refresh-token.props';

@Entity({ schema: 'auth', name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column({
    type: 'bigint',
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

  static fromProps(refreshToken: RefreshTokenProps): RefreshToken {
    if (!refreshToken) return null;

    const refreshTokenEntity = new RefreshToken();

    refreshTokenEntity.user_id = refreshToken.userId;
    refreshTokenEntity.token = refreshToken.token;
    refreshTokenEntity.identifier = refreshToken.identifier;

    return refreshTokenEntity;
  }

  static toEntity(refreshToken: RefreshToken): RefreshTokenEntity {
    if (!refreshToken) return null;

    return {
      id: refreshToken.id,
      userId: refreshToken.user_id,
      token: refreshToken.token,
      identifier: refreshToken.identifier,
      createdAt: refreshToken.created_at,
      updatedAt: refreshToken.updated_at,
      deletedAt: refreshToken.deleted_at,
    };
  }
}
