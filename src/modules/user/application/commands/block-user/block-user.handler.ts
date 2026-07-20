import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { BlockUserCommand } from './block-user.command';
import { Logger } from '@nestjs/common';
import { UserRepositoryPort } from '@user/application/ports/user-repository.port';
import { Result } from '@common/result/result';

@CommandHandler(BlockUserCommand)
export class BlockUserHandler implements ICommandHandler<
  BlockUserCommand,
  Result<boolean>
> {
  private readonly logger = new Logger(BlockUserHandler.name);

  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: BlockUserCommand): Promise<Result<boolean>> {
    this.logger.debug(
      `User ${command.blockerId} is blocking ${command.blockedId}`,
    );

    const blockerRes = await this.userRepository.getUserById(command.blockerId);
    if (blockerRes.isError()) return Result.error(blockerRes.error);

    const blockedRes = await this.userRepository.getUserById(command.blockedId);
    if (blockedRes.isError()) return Result.error(blockedRes.error);
    const blocked = blockedRes.value;

    const blocker = this.publisher.mergeObjectContext(blockerRes.value);
    const originalLength = blocker.blockedUsers.length;
    blocker.blockUser(blocked);

    if (blocker.blockedUsers.length === originalLength) {
      this.logger.log(
        `User ${command.blockerId} has already blocked user ${command.blockedId}`,
      );
      return Result.ok(false);
    }

    const saveRes = await this.userRepository.save(blockerRes.value);
    if (saveRes.isError()) {
      return Result.error(saveRes.error);
    }

    blocker.commit();

    return Result.ok(true);
  }
}
