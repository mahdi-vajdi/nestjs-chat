import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { AuthRepositoryPort } from '@auth/application/ports/auth-repository.port';
import { RefreshTokenEntity } from '@auth/domain/models/refresh-token.entity';
import { RefreshToken } from '@auth/infrastructure/database/entities/refresh-token.entity';

@Injectable()
export class AuthPostgresRepository implements AuthRepositoryPort {
  constructor(
    @InjectRepository(RefreshToken, DatabaseType.POSTGRES)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async save(entity: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    const res = await this.refreshTokenRepository.save(
      RefreshToken.fromDomain(entity),
    );

    return RefreshToken.toDomain(res);
  }

  async getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<RefreshTokenEntity | null> {
    const refreshToken = await this.refreshTokenRepository
      .createQueryBuilder('rt')
      .where('rt.user_id = :userId', { userId })
      .andWhere('rt.identifier = :identifier', { identifier })
      .getOne();

    return refreshToken ? RefreshToken.toDomain(refreshToken) : null;
  }
}
