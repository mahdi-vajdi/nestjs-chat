import { Injectable } from '@nestjs/common';
import { IAuthDatabaseProvider } from '../../../../domain/interfaces/auth-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthPostgresService implements IAuthDatabaseProvider {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}
}
