import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlockedUsersIdsQuery } from './get-blocked-users-ids.query';
import { Inject } from '@nestjs/common';
import {
  IUserReadRepositoryPort,
  USER_READ_REPOSITORY_PORT,
} from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetBlockedUsersIdsQuery)
export class GetBlockedUsersIdsHandler implements IQueryHandler<
  GetBlockedUsersIdsQuery,
  Result<string[]>
> {
  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userRepository: IUserReadRepositoryPort,
  ) {}

  async execute(query: GetBlockedUsersIdsQuery): Promise<Result<string[]>> {
    const res = await this.userRepository.getBlockedUserIds(
      query.userId,
      query.targetUserIds,
    );
    if (res.isError()) {
      return Result.error(res.error);
    }

    return Result.ok(res.value);
  }
}
