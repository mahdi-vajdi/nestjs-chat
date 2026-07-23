import { UserReadDto } from '@modules/user/application/dtos/user-read.dto';

export abstract class UserReadRepositoryPort {
  abstract getUserById(id: string): Promise<UserReadDto | null>;
  abstract getUsersByIds(ids: string[]): Promise<UserReadDto[]>;
  abstract getUserByEmail(email: string): Promise<UserReadDto | null>;
  abstract getUserByUsername(username: string): Promise<UserReadDto | null>;
  abstract getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<string[]>;
  abstract getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<boolean>;
  abstract getBlockedUserIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<string[]>;
}
