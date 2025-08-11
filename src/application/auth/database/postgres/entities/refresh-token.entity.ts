import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  RefreshTokenEntity,
  RefreshTokenProps,
} from '@auth/models/refresh-token.props';

@Entity({
  name: 'refresh_tokens',
  comment:
    'Stores the refresh tokens that are issued to the user for authentication',
})
export class RefreshToken {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({
    type: 'bigint',
    comment: 'The user id which this refresh token belongs to',
  })
  userId: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'The hashed string of the actual token',
  })
  token: string;

  @Column({
    type: 'varchar',
    unique: true,
    comment: 'A unique id to identify the jwt. usually a uuid',
  })
  identifier: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  static fromProps(refreshToken: RefreshTokenProps): RefreshToken {
    if (!refreshToken) return null;

    const refreshTokenEntity = new RefreshToken();

    refreshTokenEntity.userId = refreshToken.userId;
    refreshTokenEntity.token = refreshToken.token;
    refreshTokenEntity.identifier = refreshToken.identifier; // Assuming id is unique and can be used as identifier

    return refreshTokenEntity;
  }

  static toEntity(refreshToken: RefreshToken): RefreshTokenEntity {
    if (!refreshToken) return null;

    return {
      id: refreshToken.id,
      userId: refreshToken.userId,
      token: refreshToken.token,
      identifier: refreshToken.identifier,
      createdAt: refreshToken.createdAt,
      updatedAt: refreshToken.updatedAt,
      deletedAt: refreshToken.deletedAt,
    };
  }
}
