import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { IUserDatabaseProvider } from '@user/database/providers/user-database.provider';
import { UserEntity, UserProps } from '@user/models/user.model';
import { UserExistsQueryable } from '@user/database/postgres/queryables/user-exists.queryable';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(User, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<User>,
  ) {}

  @TryCatch
  async createUser(user: UserProps): Promise<Result<UserEntity>> {
    const res = await this.userRepository.save(User.fromProps(user));

    if (!res) Result.error('Could not create user', ErrorCode.INTERNAL);

    return Result.ok(User.toEntity(res));
  }

  @TryCatch
  async userExists(queryable: UserExistsQueryable): Promise<Result<boolean>> {
    const query = this.userRepository.createQueryBuilder('user');

    if (queryable.email)
      query.where('user.email = :email', { email: queryable.email });
    if (queryable.username)
      query.orWhere('user.username = :username', {
        username: queryable.username,
      });

    const res = await query.getExists();

    return Result.ok(res);
  }
}
