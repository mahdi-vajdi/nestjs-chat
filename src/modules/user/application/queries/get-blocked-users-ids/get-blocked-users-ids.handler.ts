import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlockedUsersIdsQuery } from './get-blocked-users-ids.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';

@QueryHandler(GetBlockedUsersIdsQuery)
export class GetBlockedUsersIdsHandler implements IQueryHandler<
  GetBlockedUsersIdsQuery,
  string[]
> {
  constructor(private readonly userRepository: UserReadRepositoryPort) {}

  async execute(query: GetBlockedUsersIdsQuery): Promise<string[]> {
    const res = await this.userRepository.getBlockedUserIds(
      query.userId,
      query.targetUserIds,
    );
    return res;
  }
}
