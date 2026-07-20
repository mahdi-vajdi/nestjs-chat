import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlockedUsersIdsQuery } from './get-blocked-users-ids.query';
import { UserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetBlockedUsersIdsQuery)
export class GetBlockedUsersIdsHandler implements IQueryHandler<
  GetBlockedUsersIdsQuery,
  Result<string[]>
> {
  constructor(private readonly userRepository: UserReadRepositoryPort) {}

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
