import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { UserEntity } from '@modules/user/domain/models/user.model';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { UserExistsOptions } from '@modules/user/application/ports/options/user-exists.options';
import { UserBlock } from '@modules/user/infrastructure/database/postgres/entities/user-block.entity';

@Injectable()
export class UserPostgresRepository implements UserRepositoryPort {
  constructor(
    @InjectRepository(User, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserBlock, DatabaseType.POSTGRES)
    private readonly userBlockRepository: Repository<UserBlock>,
    @InjectDataSource(DatabaseType.POSTGRES)
    private readonly dataSource: DataSource,
  ) {}

  async save(userEntity: UserEntity): Promise<UserEntity> {
    const res = await this.userRepository.save(User.toOrm(userEntity));
    return User.toEntity(res);
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.email = :email', { email })
      .getOne();

    return res ? User.toEntity(res) : null;
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      .getOne();

    return res ? User.toEntity(res) : null;
  }

  async getUserByUsername(username: string): Promise<UserEntity | null> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.username = :username', { username })
      .getOne();

    return res ? User.toEntity(res) : null;
  }

  async userExists(options: UserExistsOptions): Promise<boolean> {
    const query = this.userRepository.createQueryBuilder('user');

    if (options.email)
      query.where('user.email = :email', { email: options.email });
    if (options.username)
      query.orWhere('user.username = :username', {
        username: options.username,
      });

    return query.getExists();
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

  async getUsersByIds(userIds: string[]): Promise<UserEntity[]> {
    const res = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id IN (:...userIds)', { userIds })
      .getMany();

    return res.map((u) => User.toEntity(u));
  }

  async block(blockerId: string, blockedId: string): Promise<boolean> {
    return this.dataSource.transaction(async (entityManager) => {
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

      await entityManager.getRepository(UserBlock).insert(userBlock);

      return true;
    });
  }

  async unblock(blockerId: string, blockedId: string): Promise<boolean> {
    const res = await this.userBlockRepository
      .createQueryBuilder()
      .where('blocker_id = :blockerId', { blockerId })
      .andWhere('blocked_id = :blockedId', { blockedId })
      .softDelete()
      .execute();

    return res.affected !== 0;
  }

  async getBlockStatus(blockerId: string, blockedId: string): Promise<boolean> {
    return this.userBlockRepository
      .createQueryBuilder('ub')
      .where('blocker_id = :blockerId', { blockerId })
      .andWhere('blocked_id = :blockedId', { blockedId })
      .getExists();
  }

  async getBlockedUserIds(
    blockerId: string,
    blockedIds?: string[],
  ): Promise<string[]> {
    const query = this.userBlockRepository
      .createQueryBuilder('ub')
      .select('blocked_id', 'blockedId')
      .where('blocker_id = :userId', { userId: blockerId }); // Fix from :userId to match param, was previously bugged? Ah, in target it was userId

    if (blockedIds?.length) {
      query.andWhere('blocked_id IN (:...blockedIds)', { blockedIds }); // Fixed missing 's'
    }

    const res = await query.getRawMany<any>();

    return res.map((r) => r.blockedId);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.userRepository.delete({ id });
    return res.affected !== 0;
  }
}
