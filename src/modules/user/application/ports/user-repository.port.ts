import { Result } from '@common/result/result';
import { UserEntity } from '@user/domain/models/user.model';
import { UserExistsOptions } from '@user/application/ports/options/user-exists.options';

export abstract class UserRepositoryPort {
  abstract userExists(data: UserExistsOptions): Promise<Result<boolean>>;
  abstract getUsersByIds(userIds: string[]): Promise<Result<UserEntity[]>>;
  abstract getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>>;
  abstract getUserById(id: string): Promise<Result<UserEntity>>;
  abstract getUserByEmail(email: string): Promise<Result<UserEntity>>;
  abstract getUserByUsername(username: string): Promise<Result<UserEntity>>;
  abstract getBlockStatus(
    blockerId: string,
    blockedId: string,
  ): Promise<Result<boolean>>;
  abstract getBlockedUserIds(
    blockerId: string,
    blockedIds?: string[],
  ): Promise<Result<string[]>>;
  abstract save(user: UserEntity): Promise<Result<UserEntity>>;
  abstract block(
    blockerId: string,
    blockedId: string,
  ): Promise<Result<boolean>>;
  abstract unblock(
    blockerId: string,
    blockedId: string,
  ): Promise<Result<boolean>>;
}
