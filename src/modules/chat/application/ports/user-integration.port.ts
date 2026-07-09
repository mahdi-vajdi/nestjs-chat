import { Result } from '@common/result/result';

export interface ChatUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export interface BlockStatus {
  isBlocker: boolean;
  isBlocked: boolean;
}

export abstract class UserIntegrationPort {
  abstract doesUserExist(userId: string): Promise<Result<boolean>>;
  abstract hasBlockRelation(
    userA: string,
    userB: string,
  ): Promise<Result<boolean>>;
  abstract getUserById(userId: string): Promise<Result<ChatUser>>;
  abstract getUsersByIds(userIds: string[]): Promise<Result<ChatUser[]>>;
  abstract getUserIdsByNameOrUsername(
    filter: string,
  ): Promise<Result<string[]>>;
  abstract getBlockedUsersIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<Result<string[]>>;
  abstract getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<Result<BlockStatus>>;
}
