import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { ErrorCode } from '@common/result/error';
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

  @TryCatch
  async save(entity: RefreshTokenEntity): Promise<Result<RefreshTokenEntity>> {
    const res = await this.refreshTokenRepository.save(
      RefreshToken.fromDomain(entity),
    );

    return Result.ok(RefreshToken.toDomain(res));
  }

  @TryCatch
  async getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshTokenEntity>> {
    const refreshToken = await this.refreshTokenRepository
      .createQueryBuilder('rt')
      .where('rt.user_id = :userId', { userId })
      .andWhere('rt.identifier = :identifier', { identifier })
      .getOne();

    if (!refreshToken)
      return Result.error('Could not find refresh token', ErrorCode.NOT_FOUND);

    return Result.ok(RefreshToken.toDomain(refreshToken));
  }
}
