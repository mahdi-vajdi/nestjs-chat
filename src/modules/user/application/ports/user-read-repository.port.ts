import { Result } from '@common/result/result';
import { UserReadDto } from '@user/application/dtos/user-read.dto';

export const USER_READ_REPOSITORY_PORT = Symbol('USER_READ_REPOSITORY_PORT');

export interface IUserReadRepositoryPort {
  getUserById(id: string): Promise<Result<UserReadDto>>;
  getUsersByIds(ids: string[]): Promise<Result<UserReadDto[]>>;
  getUserByEmail(email: string): Promise<Result<UserReadDto>>;
  getUserByUsername(username: string): Promise<Result<UserReadDto>>;
  getUserIdsByNameOrUsername(
    nameOrUsernameFilter: string,
  ): Promise<Result<string[]>>;
  getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<Result<boolean>>;
  getBlockedUserIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<Result<string[]>>;
}
