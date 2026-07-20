import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserIdsByNameOrUsernameQuery } from './get-user-ids-by-name-or-username.query';
import { Logger } from '@nestjs/common';
import { UserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetUserIdsByNameOrUsernameQuery)
export class GetUserIdsByNameOrUsernameHandler implements IQueryHandler<
  GetUserIdsByNameOrUsernameQuery,
  Result<string[]>
> {
  private readonly logger = new Logger(GetUserIdsByNameOrUsernameHandler.name);

  constructor(private readonly userRepository: UserReadRepositoryPort) {}

  async execute(
    query: GetUserIdsByNameOrUsernameQuery,
  ): Promise<Result<string[]>> {
    const res = await this.userRepository.getUserIdsByNameOrUsername(
      query.filter,
    );
    if (res.isError()) {
      return Result.error(res.error);
    }

    this.logger.debug(
      `Fetched ${res.value.length} ids from users with filter: ${query.filter}`,
    );
    return Result.ok(res.value);
  }
}
