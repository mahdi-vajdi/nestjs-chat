import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { UserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserReadDto } from '@user/application/dtos/user-read.dto';
import { UserBlock } from '@user/infrastructure/database/entities/user-block.entity';

@Injectable()
export class UserPostgresReadRepository implements UserReadRepositoryPort {
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

  async getUserByEmail(email: string): Promise<UserReadDto | null> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :email', { email })
      .getOne();

    return res ? this.mapToDto(res) : null;
  }

  async getUserById(id: string): Promise<UserReadDto | null> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      .getOne();

    return res ? this.mapToDto(res) : null;
  }

  async getUserByUsername(username: string): Promise<UserReadDto | null> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.username = :username', { username })
      .getOne();

    return res ? this.mapToDto(res) : null;
  }

  async getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<string[]> {
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

    return res.map((row) => row.id);
  }

  async getUsersByIds(userIds: string[]): Promise<UserReadDto[]> {
    if (!userIds || userIds.length === 0) return [];

    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id IN (:...userIds)', { userIds })
      .getMany();

    return res.map((u) => this.mapToDto(u));
  }

  async getBlockStatus(blockerId: string, blockedId: string): Promise<boolean> {
    const res = await this.userBlockRepository
      .createQueryBuilder('ub')
      .where('ub.blocker_id = :blockerId', { blockerId })
      .andWhere('ub.blocked_id = :blocked_id', { blockedId })
      .getExists();

    return res;
  }

  async getBlockedUserIds(
    blockerId: string,
    blockedIds?: string[],
  ): Promise<string[]> {
    const query = this.userBlockRepository
      .createQueryBuilder('ub')
      .select('ub.blocked_id', 'blockedId')
      .where('ub.blocker_id = :userId', { userId: blockerId }); // Fixed variable interpolation

    if (blockedIds?.length) {
      query.andWhere('ub.blocked_id IN (:...blockedIds)', { blockedIds }); // Fixed s
    }

    const res = await query.getRawMany<{ blockedId: string }>();

    return res.map((r) => r.blockedId);
  }
}
