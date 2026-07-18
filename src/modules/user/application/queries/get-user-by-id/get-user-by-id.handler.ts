import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { Inject, Logger } from '@nestjs/common';
import {
  IUserReadRepositoryPort,
  USER_READ_REPOSITORY_PORT,
} from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';
import { UserReadDto } from '@user/application/dtos/user-read.dto';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<
  GetUserByIdQuery,
  Result<UserReadDto>
> {
  private readonly logger = new Logger(GetUserByIdHandler.name);

  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userRepository: IUserReadRepositoryPort,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<Result<UserReadDto>> {
    const res = await this.userRepository.getUserById(query.id);
    if (res.isError()) {
      this.logger.error(
        `Failed to get user by id ${query.id}: ${res.error.message}`,
      );
      return Result.error(res.error);
    }

    return Result.ok(res.value);
  }
}
