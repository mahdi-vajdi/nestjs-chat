import { Injectable } from '@nestjs/common';
import { IAuthDatabaseProvider } from '../../../../domain/interfaces/auth-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/shared/auth/domain/entities/refresh-token.model';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { ErrorCode } from '@common/result/error';
import { DatabaseType } from '@infrastructure/database/database-type.enum';

@Injectable()
export class AuthPostgresService implements IAuthDatabaseProvider {
  constructor(
    @InjectRepository(RefreshTokenEntity, DatabaseType.POSTGRES)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  @TryCatch
  async createRefreshToken(
    refreshToken: RefreshToken,
  ): Promise<Result<RefreshToken>> {
    const res = await this.refreshTokenRepository.save(
      RefreshTokenEntity.fromDomain(refreshToken),
    );

    return Result.ok(RefreshTokenEntity.toDomain(res));
  }

  @TryCatch
  async getRefreshToken(
    token: string,
    userId: string,
  ): Promise<Result<RefreshToken>> {
    const refreshToken = await this.refreshTokenRepository
      .createQueryBuilder('rt')
      .where('rt.userId = :userId', { userId })
      .andWhere('rt.token = :token', { token })
      .getOne();

    if (!refreshToken)
      return Result.error('Could not find refresh token', ErrorCode.NOT_FOUND);

    return Result.ok(RefreshTokenEntity.toDomain(refreshToken));
  }

  @TryCatch
  async deleteRefreshToken(id: string): Promise<Result<boolean>> {
    const res = await this.refreshTokenRepository.delete(id);

    return Result.ok(res.affected === 1);
  }

  @TryCatch
  async restoreRefreshToken(id: string): Promise<Result<boolean>> {
    const res = await this.refreshTokenRepository.restore(id);

    return Result.ok(res.affected === 1);
  }
}
