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
  abstract doesUserExist(userId: string): Promise<boolean>;
  abstract hasBlockRelation(userA: string, userB: string): Promise<boolean>;
  abstract getUserById(userId: string): Promise<ChatUser>;
  abstract getUsersByIds(userIds: string[]): Promise<ChatUser[]>;
  abstract getUserIdsByNameOrUsername(filter: string): Promise<string[]>;
  abstract getBlockedUsersIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<string[]>;
  abstract getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<BlockStatus>;
}
