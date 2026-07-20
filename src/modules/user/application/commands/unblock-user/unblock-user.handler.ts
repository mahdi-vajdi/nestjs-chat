import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { UnblockUserCommand } from './unblock-user.command';
import { Logger } from '@nestjs/common';
import { UserRepositoryPort } from '@user/application/ports/user-repository.port';
import { Result } from '@common/result/result';

@CommandHandler(UnblockUserCommand)
export class UnblockUserHandler implements ICommandHandler<
  UnblockUserCommand,
  Result<boolean>
> {
  private readonly logger = new Logger(UnblockUserHandler.name);

  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UnblockUserCommand): Promise<Result<boolean>> {
    this.logger.debug(
      `User ${command.unblockerId} is unblocking ${command.unblockedId}`,
    );

    const unblockerRes = await this.userRepository.getUserById(
      command.unblockerId,
    );
    if (unblockerRes.isError()) return Result.error(unblockerRes.error);

    const unblocker = this.publisher.mergeObjectContext(unblockerRes.value);
    const originalLength = unblocker.blockedUsers.length;
    unblocker.unblockUser({ id: command.unblockedId }); // Only need ID for unblocking

    if (unblocker.blockedUsers.length === originalLength) {
      this.logger.log(
        `User ${command.unblockedId} was not blocked by ${command.unblockerId}`,
      );
      return Result.ok(false);
    }

    const saveRes = await this.userRepository.unblock(
      command.unblockerId,
      command.unblockedId,
    );
    if (saveRes.isError()) {
      return Result.error(saveRes.error);
    }

    unblocker.commit();

    return Result.ok(true);
  }
}
