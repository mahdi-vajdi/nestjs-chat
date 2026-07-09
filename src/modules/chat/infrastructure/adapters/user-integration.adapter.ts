import { Injectable } from '@nestjs/common';
import {
  UserIntegrationPort,
  ChatUser,
  BlockStatus,
} from '@chat/application/ports/user-integration.port';
import { UserService } from '@user/application/services/user.service';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';

@Injectable()
export class UserIntegrationAdapter implements UserIntegrationPort {
  constructor(private readonly userService: UserService) {}

  async doesUserExist(userId: string): Promise<Result<boolean>> {
    const userRes = await this.userService.getUserById(userId);
    if (userRes.isError()) {
      if (
        userRes.error.message.includes('not found') ||
        userRes.error.code === ErrorCode.NOT_FOUND
      ) {
        return Result.ok(false);
      }
      return Result.error(userRes.error);
    }
    return Result.ok(true);
  }

  async hasBlockRelation(
    userA: string,
    userB: string,
  ): Promise<Result<boolean>> {
    const res = await this.userService.getBlockStatus(userA, userB);
    if (res.isError()) {
      return Result.error(res.error);
    }
    return Result.ok(res.value.isBlocked || res.value.isBlocker);
  }

  async getUserById(userId: string): Promise<Result<ChatUser>> {
    const res = await this.userService.getUserById(userId);
    if (res.isError()) return Result.error(res.error);
    return Result.ok({
      id: res.value.id,
      username: res.value.username,
      firstName: res.value.firstName,
      lastName: res.value.lastName,
      avatar: res.value.avatar,
    });
  }

  async getUsersByIds(userIds: string[]): Promise<Result<ChatUser[]>> {
    const res = await this.userService.getUsersByIds(userIds);
    if (res.isError()) return Result.error(res.error);
    return Result.ok(
      res.value.map((u) => ({
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        avatar: u.avatar,
      })),
    );
  }

  async getUserIdsByNameOrUsername(filter: string): Promise<Result<string[]>> {
    return this.userService.getUserIdsByNameOrUsername(filter);
  }

  async getBlockedUsersIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<Result<string[]>> {
    return this.userService.getBlockedUsersIds(userId, targetUserIds);
  }

  async getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<Result<BlockStatus>> {
    return this.userService.getBlockStatus(userId, targetUserId);
  }
}
