import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { IUserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';
import { UserReadDto } from '@user/application/dtos/user-read.dto';
import { UserBlock } from '@user/infrastructure/postgres/entities/user-block.entity';

@Injectable()
export class UserPostgresReadRepository implements IUserReadRepositoryPort {
  constructor(
    @InjectRepository(User, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserBlock, DatabaseType.POSTGRES) // Fixed entity injection
    private readonly userBlockRepository: Repository<UserBlock>,
  ) {}

  private mapToDto(user: User): UserReadDto {
    return new UserReadDto(
      user.id,
      user.email,
      user.username,
      user.role,
      user.first_name,
      user.last_name,
      user.avatar,
      user.created_at,
      user.password, // Included for validate password query
    );
  }

  @TryCatch
  async getUserByEmail(email: string): Promise<Result<UserReadDto>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :email', { email })
      .getOne();

    if (!res) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(this.mapToDto(res));
  }

  @TryCatch
  async getUserById(id: string): Promise<Result<UserReadDto>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      .getOne();

    if (!res) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(this.mapToDto(res));
  }

  @TryCatch
  async getUserByUsername(username: string): Promise<Result<UserReadDto>> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.username = :username', { username })
      .getOne();

    if (!res) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(this.mapToDto(res));
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
  async getUsersByIds(userIds: string[]): Promise<Result<UserReadDto[]>> {
    if (!userIds || userIds.length === 0) return Result.ok([]);

    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id IN (:...userIds)', { userIds })
      .getMany();

    return Result.ok(res.map((u) => this.mapToDto(u)));
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

    const res = await query.getRawMany<{ blockedId: string }>();

    return Result.ok(res.map((r) => r.blockedId));
  }
}
