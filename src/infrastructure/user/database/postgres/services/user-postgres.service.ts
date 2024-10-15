import { Injectable } from '@nestjs/common';
import { IUserDatabaseProvider } from '@domain/user/interfaces/user-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { DatabaseType } from '@shared/database/database-type.enum';
import { Repository } from 'typeorm';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { User } from '@domain/user/entities/user.model';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(UserEntity, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @TryCatch
  async createUser(user: User): Promise<Result<User>> {
    const res = await this.userRepository.save(UserEntity.fromDomain(user));

    if (!res) Result.error('Could not find user', ErrorCode.NOT_FOUND);

    return Result.ok(UserEntity.toDomain(res));
  }
}
