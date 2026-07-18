import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { VerifyAccessTokenQuery } from './verify-access-token.query';
import { Result } from '@common/result/result';
import { AccessTokenPayload } from '@auth/domain/types/access-token-payload.type';
import { ErrorCode } from '@common/result/error';
import { TokenService } from '@auth/application/services/token.service';

@QueryHandler(VerifyAccessTokenQuery)
export class VerifyAccessTokenHandler implements IQueryHandler<
  VerifyAccessTokenQuery,
  Result<AccessTokenPayload>
> {
  constructor(private readonly tokenService: TokenService) {}

  async execute(
    query: VerifyAccessTokenQuery,
  ): Promise<Result<AccessTokenPayload>> {
    try {
      const payload =
        await this.tokenService.verifyAccessToken<AccessTokenPayload>(
          query.accessToken,
        );
      return Result.ok(payload);
    } catch {
      return Result.error('Invalid access token', ErrorCode.UNAUTHENTICATED);
    }
  }
}
