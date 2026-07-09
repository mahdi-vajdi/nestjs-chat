import { Result } from '@common/result/result';

export abstract class UserIntegrationPort {
  abstract doesUserExist(userId: string): Promise<Result<boolean>>;
  abstract hasBlockRelation(
    userA: string,
    userB: string,
  ): Promise<Result<boolean>>;
}
