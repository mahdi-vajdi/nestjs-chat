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
import { UserExistsOptions } from '@user/database/options/user-exists.options';

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
  async getUserByEmail(email: string): Promise<Result<UserEntity>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :email', { email })
      .getOne();

    if (!res) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(User.toEntity(res));
  }

  @TryCatch
  async getUserById(id: string): Promise<Result<UserEntity>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      .getOne();

    if (!res) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(User.toEntity(res));
  }

  @TryCatch
  async getUserByUsername(username: string): Promise<Result<UserEntity>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.username = :username', { username })
      .getOne();

    if (!res) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(User.toEntity(res));
  }

  @TryCatch
  async userExists(options: UserExistsOptions): Promise<Result<boolean>> {
    const query = this.userRepository.createQueryBuilder('user');

    if (options.email)
      query.where('user.email = :email', { email: options.email });
    if (options.username)
      query.orWhere('user.username = :username', {
        username: options.username,
      });

    const res = await query.getExists();

    return Result.ok(res);
  }

  @TryCatch
  async getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .where('u.first_name ILIKE :filter')
      .orWhere('u.last_name ILIKE :filter')
      .orWhere('u.username ILIKE :filter')
      .setParameters({
        filter: `%${nameOrUsernameFilter}%`,
      })
      .getRawMany();

    return Result.ok(res.map((row) => row.id));
  }

  @TryCatch
  async getUsersByIds(userIds: string[]): Promise<Result<UserEntity[]>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id IN (:...userIds)', { userIds })
      .getMany();

    return Result.ok(res.map((u) => User.toEntity(u)));
  }
}
