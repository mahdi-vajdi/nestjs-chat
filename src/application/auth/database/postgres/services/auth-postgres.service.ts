import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { ErrorCode } from '@common/result/error';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { IAuthDatabaseProvider } from '@auth/database/providers/auth-database.provider';
import {
  RefreshTokenEntity,
  RefreshTokenProps,
} from '@auth/models/refresh-token.props';
import { RefreshToken } from '@auth/database/postgres/entities/refresh-token.entity';

@Injectable()
export class AuthPostgresService implements IAuthDatabaseProvider {
  constructor(
    @InjectRepository(RefreshToken, DatabaseType.POSTGRES)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  @TryCatch
  async createRefreshToken(
    props: RefreshTokenProps,
  ): Promise<Result<RefreshToken>> {
    const res = await this.refreshTokenRepository.save(
      RefreshToken.fromProps(props),
    );

    return Result.ok(RefreshToken.toEntity(res));
  }

  @TryCatch
  async getRefreshToken(
    identifier: string,
    userId: string,
  ): Promise<Result<RefreshTokenEntity>> {
    const refreshToken = await this.refreshTokenRepository
      .createQueryBuilder('rt')
      .where('rt.userId = :userId', { userId })
      .andWhere('rt.identifier = :identifier', { identifier })
      .getOne();

    if (!refreshToken)
      return Result.error('Could not find refresh token', ErrorCode.NOT_FOUND);

    return Result.ok(RefreshToken.toEntity(refreshToken));
  }

  @TryCatch
  async deleteRefreshToken(id: string): Promise<Result<boolean>> {
    const res = await this.refreshTokenRepository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id })
      .execute();

    return Result.ok(res.affected === 1);
  }

  @TryCatch
  async restoreRefreshToken(id: string): Promise<Result<boolean>> {
    const res = await this.refreshTokenRepository
      .createQueryBuilder()
      .restore()
      .where('id = :id', { id })
      .execute();

    return Result.ok(res.affected === 1);
  }
}
