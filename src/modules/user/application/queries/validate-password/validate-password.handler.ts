import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ValidatePasswordQuery } from './validate-password.query';
import { Inject, Logger } from '@nestjs/common';
import {
  IUserReadRepositoryPort,
  USER_READ_REPOSITORY_PORT,
} from '@user/application/ports/user-read-repository.port';
import { Result } from '@common/result/result';
import { UserReadDto } from '@user/application/dtos/user-read.dto';
import validator from 'validator';
import * as bcrypt from 'bcrypt';
import { ErrorCode } from '@common/result/error';

@QueryHandler(ValidatePasswordQuery)
export class ValidatePasswordHandler implements IQueryHandler<
  ValidatePasswordQuery,
  Result<UserReadDto>
> {
  private readonly logger = new Logger(ValidatePasswordHandler.name);

  constructor(
    @Inject(USER_READ_REPOSITORY_PORT)
    private readonly userRepository: IUserReadRepositoryPort,
  ) {}

  async execute(query: ValidatePasswordQuery): Promise<Result<UserReadDto>> {
    let userRes: Result<UserReadDto>;

    const isEmail = validator.isEmail(query.property);
    if (isEmail) {
      userRes = await this.userRepository.getUserByEmail(query.property);
    } else {
      userRes = await this.userRepository.getUserByUsername(query.property);
    }

    if (userRes.isError()) {
      this.logger.error(
        `Failed to get user by property ${query.property}: ${userRes.error.message}`,
      );
      return Result.error(userRes.error);
    }

    const passwordMatches = await bcrypt.compare(
      query.password,
      userRes.value.password,
    );
    if (!passwordMatches) {
      return Result.error(
        'Username or password combination is invalid',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    return Result.ok(userRes.value);
  }
}
