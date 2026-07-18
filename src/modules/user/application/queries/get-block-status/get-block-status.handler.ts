import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlockStatusQuery } from './get-block-status.query';
import { Inject } from '@nestjs/common';
import {
  IUserReadRepositoryPort,
  USER_READ_REPOSITORY_PORT,
} from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';
import { GetBlockStatusResponse } from './get-block-status.response';

@QueryHandler(GetBlockStatusQuery)
export class GetBlockStatusHandler implements IQueryHandler<
  GetBlockStatusQuery,
  Result<GetBlockStatusResponse>
> {
  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userRepository: IUserReadRepositoryPort,
  ) {}

  async execute(
    query: GetBlockStatusQuery,
  ): Promise<Result<GetBlockStatusResponse>> {
    const [isBlockerRes, isBlockedRes] = await Promise.all([
      this.userRepository.getBlockStatus(query.userId, query.targetUserId),
      this.userRepository.getBlockStatus(query.targetUserId, query.userId),
    ]);

    if (isBlockerRes.isError()) {
      return Result.error(isBlockerRes.error);
    }
    if (isBlockedRes.isError()) {
      return Result.error(isBlockedRes.error);
    }

    return Result.ok({
      isBlocker: isBlockerRes.value,
      isBlocked: isBlockedRes.value,
    });
  }
}
