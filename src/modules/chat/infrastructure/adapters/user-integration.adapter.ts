import { Injectable } from '@nestjs/common';
import {
  BlockStatus,
  ChatUser,
  UserIntegrationPort,
} from '@chat/application/ports/user-integration.port';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '@user/application/queries/get-user-by-id/get-user-by-id.query';
import { GetBlockStatusQuery } from '@user/application/queries/get-block-status/get-block-status.query';
import { GetUsersByIdsQuery } from '@user/application/queries/get-users-by-ids/get-users-by-ids.query';
import { GetUserIdsByNameOrUsernameQuery } from '@user/application/queries/get-user-ids-by-name-or-username/get-user-ids-by-name-or-username.query';
import { GetBlockedUsersIdsQuery } from '@user/application/queries/get-blocked-users-ids/get-blocked-users-ids.query';
import { UserNotFoundException } from '@user/domain/user.exceptions';

@Injectable()
export class UserIntegrationAdapter implements UserIntegrationPort {
  constructor(private readonly queryBus: QueryBus) {}

  async doesUserExist(userId: string): Promise<boolean> {
    try {
      await this.queryBus.execute(new GetUserByIdQuery(userId));
      return true;
    } catch (e) {
      if (e instanceof UserNotFoundException) {
        return false;
      }
      throw e;
    }
  }

  async hasBlockRelation(userA: string, userB: string): Promise<boolean> {
    const res = await this.queryBus.execute(
      new GetBlockStatusQuery(userA, userB),
    );
    return res.isBlocked || res.isBlocker;
  }

  async getUserById(userId: string): Promise<ChatUser> {
    const res = await this.queryBus.execute(new GetUserByIdQuery(userId));
    return {
      id: res.id,
      username: res.username,
      firstName: res.firstName,
      lastName: res.lastName,
      avatar: res.avatar,
    };
  }

  async getUsersByIds(userIds: string[]): Promise<ChatUser[]> {
    const res = await this.queryBus.execute(new GetUsersByIdsQuery(userIds));
    return res.map((u: any) => ({
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
    }));
  }

  async getUserIdsByNameOrUsername(filter: string): Promise<string[]> {
    return this.queryBus.execute(new GetUserIdsByNameOrUsernameQuery(filter));
  }

  async getBlockedUsersIds(
    userId: string,
    targetUserIds: string[],
  ): Promise<string[]> {
    return this.queryBus.execute(
      new GetBlockedUsersIdsQuery(userId, targetUserIds),
    );
  }

  async getBlockStatus(
    userId: string,
    targetUserId: string,
  ): Promise<BlockStatus> {
    return this.queryBus.execute(new GetBlockStatusQuery(userId, targetUserId));
  }
}
