import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserIdsByNameOrUsernameQuery } from './get-user-ids-by-name-or-username.query';
import { Logger } from '@nestjs/common';
import { UserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';

@QueryHandler(GetUserIdsByNameOrUsernameQuery)
export class GetUserIdsByNameOrUsernameHandler implements IQueryHandler<
  GetUserIdsByNameOrUsernameQuery,
  string[]
> {
  private readonly logger = new Logger(GetUserIdsByNameOrUsernameHandler.name);

  constructor(private readonly userRepository: UserReadRepositoryPort) {}

  async execute(query: GetUserIdsByNameOrUsernameQuery): Promise<string[]> {
    const res = await this.userRepository.getUserIdsByNameOrUsername(
      query.filter,
    );

    this.logger.debug(
      `Fetched ${res.length} ids from users with filter: ${query.filter}`,
    );
    return res;
  }
}
