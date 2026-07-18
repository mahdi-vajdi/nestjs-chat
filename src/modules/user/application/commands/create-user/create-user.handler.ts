import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { Inject, Logger } from '@nestjs/common';
import {
  IUserRepositoryPort,
  USER_REPOSITORY_PORT,
} from '@user/application/ports/user-repository.port';
import { Result } from '@common/result/result';
import { UserEntity } from '@user/domain/models/user.model';
import { ErrorCode } from '@common/result/error';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  Result<UserEntity>
> {
  private readonly logger = new Logger(CreateUserHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: IUserRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<UserEntity>> {
    this.logger.debug('Checking if user exists before creating one.');

    // Check if email exists
    const emailExists = await this.userRepository.userExists({
      email: command.email,
    });
    if (emailExists.isError()) return Result.error(emailExists.error);
    if (emailExists.value) {
      return Result.error('Your email is Duplicate', ErrorCode.ALREADY_EXISTS);
    }

    let finalUsername = command.username;

    // Check or generate username
    if (finalUsername) {
      const usernameExists = await this.userRepository.userExists({
        username: finalUsername,
      });
      if (usernameExists.isError()) return Result.error(usernameExists.error);
      if (usernameExists.value) {
        return Result.error(
          'Your username is Duplicate',
          ErrorCode.ALREADY_EXISTS,
        );
      }
    } else {
      let isUsernameUnique = false;
      do {
        finalUsername = `user_${crypto.randomBytes(5).toString('hex')}`;
        const usernameExists = await this.userRepository.userExists({
          username: finalUsername,
        });
        if (usernameExists.isError())
          return Result.error('Error generating username', ErrorCode.INTERNAL);
        if (!usernameExists.value) isUsernameUnique = true;
      } while (!isUsernameUnique);
    }

    // Hash password
    const hashedPassword = command.password
      ? await bcrypt.hash(command.password, this.HASH_SALT)
      : '';

    const userEntity = UserEntity.create(
      command.email,
      finalUsername,
      hashedPassword,
      command.firstName,
      command.lastName,
      command.avatar,
    );

    const user = this.publisher.mergeObjectContext(userEntity);

    const saveRes = await this.userRepository.save(user);
    if (saveRes.isError()) return Result.error(saveRes.error);

    user.commit();

    this.logger.log(
      `Created user successfully with ID: ${user.id}, email: ${command.email} and username: ${finalUsername}`,
    );
    return Result.ok(user);
  }
}
