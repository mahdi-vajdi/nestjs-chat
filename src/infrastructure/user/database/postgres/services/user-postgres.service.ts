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
import { UserExists } from './dto/user-exists.dto';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(UserEntity, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @TryCatch
  async createUser(user: User): Promise<Result<User>> {
    const res = await this.userRepository.save(UserEntity.fromDomain(user));

    if (!res) Result.error('Could not create user', ErrorCode.INTERNAL);

    return Result.ok(UserEntity.toDomain(res));
  }

  @TryCatch
  async userExists(data: UserExists): Promise<Result<boolean>> {
    const query = this.userRepository.createQueryBuilder('user');

    if (data.email) query.where('user.email = :email', { email: data.email });

    const res = await query.getExists();

    return Result.ok(res);
  }
}
