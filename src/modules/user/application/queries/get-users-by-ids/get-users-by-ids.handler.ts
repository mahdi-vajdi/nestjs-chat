import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersByIdsQuery } from './get-users-by-ids.query';
import { Inject } from '@nestjs/common';
import {
  IUserReadRepositoryPort,
  USER_READ_REPOSITORY_PORT,
} from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';
import { UserReadDto } from '@user/application/dtos/user-read.dto';

@QueryHandler(GetUsersByIdsQuery)
export class GetUsersByIdsHandler implements IQueryHandler<
  GetUsersByIdsQuery,
  Result<UserReadDto[]>
> {
  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userRepository: IUserReadRepositoryPort,
  ) {}

  async execute(query: GetUsersByIdsQuery): Promise<Result<UserReadDto[]>> {
    const res = await this.userRepository.getUsersByIds(query.userIds);
    if (res.isError()) {
      return Result.error(res.error);
    }

    return Result.ok(res.value);
  }
}
