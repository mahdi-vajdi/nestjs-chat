import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { UnblockUserCommand } from './unblock-user.command';
import { Logger } from '@nestjs/common';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { UserNotFoundException } from '@modules/user/domain/user.exceptions';
import { UserUnblockedEvent } from '@modules/user/domain/events/user-unblocked.event';

@CommandHandler(UnblockUserCommand)
export class UnblockUserHandler implements ICommandHandler<
  UnblockUserCommand,
  boolean
> {
  private readonly logger = new Logger(UnblockUserHandler.name);

  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UnblockUserCommand): Promise<boolean> {
    this.logger.debug(
      `User ${command.unblockerId} is unblocking ${command.unblockedId}`,
    );

    const unblockerRes = await this.userRepository.getUserById(
      command.unblockerId,
    );
    if (!unblockerRes) throw new UserNotFoundException(command.unblockerId);

    const isBlocked = await this.userRepository.getBlockStatus(
      command.unblockerId,
      command.unblockedId,
    );

    if (!isBlocked) {
      this.logger.log(
        `User ${command.unblockedId} was not blocked by ${command.unblockerId}`,
      );
      return false;
    }

    await this.userRepository.unblock(command.unblockerId, command.unblockedId);

    const unblocker = this.publisher.mergeObjectContext(unblockerRes);
    unblocker.apply(
      new UserUnblockedEvent(command.unblockerId, command.unblockedId),
    );
    unblocker.commit();

    return true;
  }
}
