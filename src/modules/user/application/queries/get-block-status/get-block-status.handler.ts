import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBlockStatusQuery } from './get-block-status.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';
import { GetBlockStatusResponse } from './get-block-status.response';

@QueryHandler(GetBlockStatusQuery)
export class GetBlockStatusHandler implements IQueryHandler<
  GetBlockStatusQuery,
  GetBlockStatusResponse
> {
  constructor(private readonly userRepository: UserReadRepositoryPort) {}

  async execute(query: GetBlockStatusQuery): Promise<GetBlockStatusResponse> {
    const [isBlockerRes, isBlockedRes] = await Promise.all([
      this.userRepository.getBlockStatus(query.userId, query.targetUserId),
      this.userRepository.getBlockStatus(query.targetUserId, query.userId),
    ]);

    return {
      isBlocker: isBlockerRes,
      isBlocked: isBlockedRes,
    };
  }
}
