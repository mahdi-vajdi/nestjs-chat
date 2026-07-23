import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { Logger } from '@nestjs/common';
import { UserRepositoryPort } from '@user/application/ports/user-repository.port';

import { UserEntity } from '@user/domain/models/user.model';
import { UserAlreadyExistsException } from '@user/domain/user.exceptions';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<
  CreateUserCommand,
  UserEntity
> {
  private readonly logger = new Logger(CreateUserHandler.name);
  private readonly HASH_SALT = 10;

  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserEntity> {
    this.logger.debug('Checking if user exists before creating one.');

    // Check if email exists
    const emailExists = await this.userRepository.userExists({
      email: command.email,
    });
    if (emailExists) {
      throw new UserAlreadyExistsException('Your email is Duplicate');
    }

    let finalUsername = command.username;

    // Check or generate username
    if (finalUsername) {
      const usernameExists = await this.userRepository.userExists({
        username: finalUsername,
      });
      if (usernameExists) {
        throw new UserAlreadyExistsException('Your username is Duplicate');
      }
    } else {
      let isUsernameUnique = false;
      do {
        finalUsername = `user_${crypto.randomBytes(5).toString('hex')}`;
        const usernameExists = await this.userRepository.userExists({
          username: finalUsername,
        });
        if (!usernameExists) isUsernameUnique = true;
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

    await this.userRepository.save(user);

    user.commit();

    this.logger.log(
      `Created user successfully with ID: ${user.id}, email: ${command.email} and username: ${finalUsername}`,
    );
    return user;
  }
}
