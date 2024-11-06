import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../../../../domain/entities/refresh-token.model';

@Entity({
  name: 'refresh_tokens',
  comment:
    'Stores the refresh tokens that are issued to the user for authentication',
})
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('increment')
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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  static fromDomain(refreshToken: RefreshToken): RefreshTokenEntity {
    if (!refreshToken) return null;

    const refreshTokenEntity = new RefreshTokenEntity();

    refreshTokenEntity.id = refreshToken.id;
    refreshTokenEntity.userId = refreshToken.userId;
    refreshTokenEntity.token = refreshToken.token;
    refreshTokenEntity.createdAt = refreshToken.createdAt;
    refreshTokenEntity.updatedAt = refreshToken.updatedAt;
    refreshTokenEntity.deletedAt = refreshToken.deletedAt;

    return refreshTokenEntity;
  }

  static toDomain(a: RefreshTokenEntity): RefreshToken {
    if (!a) return null;

    return new RefreshToken({
      id: a.id,
      userId: a.userId,
      token: a.token,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      deletedAt: a.deletedAt,
    });
  }
}
