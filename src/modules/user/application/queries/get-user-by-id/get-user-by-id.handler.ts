import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { Logger } from '@nestjs/common';
import { UserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';
import { UserNotFoundException } from '@user/domain/user.exceptions';
import { UserReadDto } from '@user/application/dtos/user-read.dto';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<
  GetUserByIdQuery,
  UserReadDto
> {
  private readonly logger = new Logger(GetUserByIdHandler.name);

  constructor(private readonly userRepository: UserReadRepositoryPort) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    const res = await this.userRepository.getUserById(query.id);
    if (!res) {
      this.logger.error(`Failed to get user by id ${query.id}`);
      throw new UserNotFoundException(query.id);
    }

    return res;
  }
}
