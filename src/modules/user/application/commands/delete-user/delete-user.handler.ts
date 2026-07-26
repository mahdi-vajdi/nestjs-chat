import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserCommand } from './delete-user.command';
import { Logger } from '@nestjs/common';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  private readonly logger = new Logger(DeleteUserHandler.name);

  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    this.logger.log(`Deleting user with ID: ${command.id}`);
    const deleted = await this.userRepository.delete(command.id);
    if (!deleted) {
      this.logger.warn(
        `User with ID ${command.id} not found or could not be deleted.`,
      );
    } else {
      this.logger.log(`Successfully deleted user ${command.id}.`);
    }
  }
}
