import { Result } from '@common/result/result';
import { UserReadDto } from '@user/application/dtos/user-read.dto';

export abstract class UserReadRepositoryPort {
  abstract getUserById(id: string): Promise<Result<UserReadDto>>;
  abstract getUsersByIds(ids: string[]): Promise<Result<UserReadDto[]>>;
  abstract getUserByEmail(email: string): Promise<Result<UserReadDto>>;
  abstract getUserByUsername(username: string): Promise<Result<UserReadDto>>;
  abstract getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>>;
  abstract getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>>;
  abstract getBlockedUserIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<Result<string[]>>;
}
