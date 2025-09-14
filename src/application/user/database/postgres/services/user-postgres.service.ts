import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { IUserDatabaseProvider } from '@user/database/providers/user-database.provider';
import { UserEntity, UserProps } from '@user/models/user.model';
import { UserExistsOptions } from '@user/database/options/user-exists.options';
import { UserBlock } from '@user/database/postgres/entities/user-block.entity';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(User, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<User>,
    @InjectRepository(User, DatabaseType.POSTGRES)
    private readonly userBlockRepository: Repository<UserBlock>,
    @InjectDataSource(DatabaseType.POSTGRES)
    private readonly dataSource: DataSource,
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

  @TryCatch
  async block(blockerId: string, blockedId: string): Promise<Result<boolean>> {
    const res = await this.dataSource.transaction(async (entityManager) => {
      const status = await entityManager
        .getRepository(UserBlock)
        .createQueryBuilder('ub')
        .where('blocker_id = :blockerId', { blockerId })
        .andWhere('blocked_id = :blockedId', { blockedId })
        .getExists();
      if (status == true) {
        return false;
      }

      const userBlock = new UserBlock();
      userBlock.blocker_id = blockerId;
      userBlock.blocked_id = blockedId;

      await this.userBlockRepository.insert(userBlock);

      return true;
    });

    return Result.ok(res);
  }

  @TryCatch
  async unblock(
    blockerId: string,
    blockedId: string,
  ): Promise<Result<boolean>> {
    const res = await this.userBlockRepository
      .createQueryBuilder()
      .where('blocker_id = :blockerId', { blockerId })
      .andWhere('blocked_id = :blockedId', { blockedId })
      .softDelete()
      .execute();

    return Result.ok(res.affected !== 0);
  }

  @TryCatch
  async getBlockStatus(
    blockerId: string,
    blockedId: string,
  ): Promise<Result<boolean>> {
    const res = await this.userBlockRepository
      .createQueryBuilder('ub')
      .where('ub.blocker_id = :blockerId', { blockerId })
      .andWhere('ub.blocked_id = :blocked_id', { blockedId })
      .getExists();

    return Result.ok(res);
  }

  @TryCatch
  async getBlockedUserIds(
    blockerId: string,
    blockedIds?: string[],
  ): Promise<Result<string[]>> {
    const query = this.userBlockRepository
      .createQueryBuilder('ub')
      .select('ub.blocked_id', 'blockedId')
      .where('ub.blocker_id = :userId', { blockerId });

    if (blockedIds?.length) {
      query.andWhere('ub.blocked_id IN (:...blockedId)', { blockedIds });
    }

    const res = await query.getRawMany<string>();

    return Result.ok(res);
  }
}
