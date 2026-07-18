import { Injectable } from '@nestjs/common';
import {
  UserIntegrationPort,
  ChatUser,
  BlockStatus,
} from '@chat/application/ports/user-integration.port';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '@user/application/queries/get-user-by-id/get-user-by-id.query';
import { GetBlockStatusQuery } from '@user/application/queries/get-block-status/get-block-status.query';
import { GetUsersByIdsQuery } from '@user/application/queries/get-users-by-ids/get-users-by-ids.query';
import { GetUserIdsByNameOrUsernameQuery } from '@user/application/queries/get-user-ids-by-name-or-username/get-user-ids-by-name-or-username.query';
import { GetBlockedUsersIdsQuery } from '@user/application/queries/get-blocked-users-ids/get-blocked-users-ids.query';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';

@Injectable()
export class UserIntegrationAdapter implements UserIntegrationPort {
  constructor(private readonly queryBus: QueryBus) {}

  async doesUserExist(userId: string): Promise<Result<boolean>> {
    const userRes = await this.queryBus.execute(new GetUserByIdQuery(userId));
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
    const res = await this.queryBus.execute(
      new GetBlockStatusQuery(userA, userB),
    );
    if (res.isError()) {
      return Result.error(res.error);
    }
    return Result.ok(res.value.isBlocked || res.value.isBlocker);
  }

  async getUserById(userId: string): Promise<Result<ChatUser>> {
    const res = await this.queryBus.execute(new GetUserByIdQuery(userId));
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
    const res = await this.queryBus.execute(new GetUsersByIdsQuery(userIds));
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
    return this.queryBus.execute(new GetUserIdsByNameOrUsernameQuery(filter));
  }

  async getBlockedUsersIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<Result<string[]>> {
    return this.queryBus.execute(
      new GetBlockedUsersIdsQuery(userId, targetUserIds),
    );
  }

  async getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<Result<BlockStatus>> {
    return this.queryBus.execute(new GetBlockStatusQuery(userId, targetUserId));
  }
}
