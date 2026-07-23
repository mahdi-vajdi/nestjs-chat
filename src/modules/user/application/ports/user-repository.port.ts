import { UserEntity } from '@modules/user/domain/models/user.model';
import { UserExistsOptions } from '@modules/user/application/ports/options/user-exists.options';

export abstract class UserRepositoryPort {
  abstract userExists(data: UserExistsOptions): Promise<boolean>;
  abstract getUsersByIds(userIds: string[]): Promise<UserEntity[]>;
  abstract getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<string[]>;
  abstract getUserById(id: string): Promise<UserEntity | null>;
  abstract getUserByEmail(email: string): Promise<UserEntity | null>;
  abstract getUserByUsername(username: string): Promise<UserEntity | null>;
  abstract getBlockStatus(
    blockerId: string,
    blockedId: string,
  ): Promise<boolean>;
  abstract getBlockedUserIds(
    blockerId: string,
    blockedIds?: string[],
  ): Promise<string[]>;
  abstract save(user: UserEntity): Promise<UserEntity>;
  abstract block(blockerId: string, blockedId: string): Promise<boolean>;
  abstract unblock(blockerId: string, blockedId: string): Promise<boolean>;
}
