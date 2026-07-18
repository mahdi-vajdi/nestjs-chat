import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserIdsByNameOrUsernameQuery } from './get-user-ids-by-name-or-username.query';
import { Inject, Logger } from '@nestjs/common';
import {
  IUserReadRepositoryPort,
  USER_READ_REPOSITORY_PORT,
} from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';

@QueryHandler(GetUserIdsByNameOrUsernameQuery)
export class GetUserIdsByNameOrUsernameHandler implements IQueryHandler<
  GetUserIdsByNameOrUsernameQuery,
  Result<string[]>
> {
  private readonly logger = new Logger(GetUserIdsByNameOrUsernameHandler.name);

  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userRepository: IUserReadRepositoryPort,
  ) {}

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
