import { Injectable } from '@nestjs/common';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
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

    // If either user blocked the other, there is a block relation
    return Result.ok(res.value.isBlocked || res.value.isBlocker);
  }
}
