import { Result } from '@common/result/result';
import { UserEntity } from '@user/domain/models/user.model';
import { UserExistsOptions } from '@user/application/ports/options/user-exists.options';

interface IUserDatabaseReader {
  userExists(data: UserExistsOptions): Promise<Result<boolean>>;

  getUsersByIds(userIds: string[]): Promise<Result<UserEntity[]>>;

  getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>>;

  getUserById(id: string): Promise<Result<UserEntity>>;

  getUserByEmail(email: string): Promise<Result<UserEntity>>;

  getUserByUsername(username: string): Promise<Result<UserEntity>>;

  getBlockStatus(
    blockerId: string,
    blockedId: string,
  ): Promise<Result<boolean>>;

  getBlockedUserIds(
    blockerId: string,
    blockedIds?: string[],
  ): Promise<Result<string[]>>;
}

interface IUserDatabaseWriter {
  save(user: UserEntity): Promise<Result<UserEntity>>;

  block(blockerId: string, blockedId: string): Promise<Result<boolean>>;

  unblock(blockerId: string, blockedId: string): Promise<Result<boolean>>;
}

export interface IUserRepositoryPort
  extends IUserDatabaseReader, IUserDatabaseWriter {}

export const USER_REPOSITORY_PORT = 'user-database-provider';
