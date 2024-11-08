import { Injectable } from '@nestjs/common';
import { IAuthDatabaseProvider } from '../../../../domain/interfaces/auth-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/shared/auth/domain/entities/refresh-token.model';
import { Result } from '@common/result/result';
import { TryCatch } from '@common/decorators/try-catch.decorator';

@Injectable()
export class AuthPostgresService implements IAuthDatabaseProvider {
  constructor(
    @InjectRepository(RefreshTokenEntity)
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
}
