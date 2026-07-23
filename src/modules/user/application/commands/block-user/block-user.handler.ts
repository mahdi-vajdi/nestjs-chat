import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { BlockUserCommand } from './block-user.command';
import { Logger } from '@nestjs/common';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { UserNotFoundException } from '@modules/user/domain/user.exceptions';

@CommandHandler(BlockUserCommand)
export class BlockUserHandler implements ICommandHandler<
  BlockUserCommand,
  boolean
> {
  private readonly logger = new Logger(BlockUserHandler.name);

  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: BlockUserCommand): Promise<boolean> {
    this.logger.debug(
      `User ${command.blockerId} is blocking ${command.blockedId}`,
    );

    const blockerRes = await this.userRepository.getUserById(command.blockerId);
    if (!blockerRes) throw new UserNotFoundException(command.blockerId);

    const blockedRes = await this.userRepository.getUserById(command.blockedId);
    if (!blockedRes) throw new UserNotFoundException(command.blockedId);
    const blocked = blockedRes;

    const blocker = this.publisher.mergeObjectContext(blockerRes);
    const originalLength = blocker.blockedUsers.length;
    blocker.blockUser(blocked);

    if (blocker.blockedUsers.length === originalLength) {
      this.logger.log(
        `User ${command.blockerId} has already blocked user ${command.blockedId}`,
      );
      return false;
    }

    await this.userRepository.save(blockerRes);

    blocker.commit();

    return true;
  }
}
