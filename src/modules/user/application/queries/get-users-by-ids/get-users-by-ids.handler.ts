import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersByIdsQuery } from './get-users-by-ids.query';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';

import { UserReadDto } from '@modules/user/application/dtos/user-read.dto';

@QueryHandler(GetUsersByIdsQuery)
export class GetUsersByIdsHandler implements IQueryHandler<
  GetUsersByIdsQuery,
  UserReadDto[]
> {
  constructor(private readonly userRepository: UserReadRepositoryPort) {}

  async execute(query: GetUsersByIdsQuery): Promise<UserReadDto[]> {
    return this.userRepository.getUsersByIds(query.userIds);
  }
}
