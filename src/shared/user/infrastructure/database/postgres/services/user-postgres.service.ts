import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { UserExists } from './dto/user-exists.dto';
import { IUserDatabaseProvider } from '@user/domain/interfaces/user-database.provider';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { User } from '@user/domain/entities/user.model';

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
