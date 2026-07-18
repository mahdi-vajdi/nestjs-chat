import { Injectable } from '@nestjs/common';
import {
  AuthIntegrationPort,
  ValidatedTokenPayload,
} from '@chat/application/ports/auth-integration.port';
import { QueryBus } from '@nestjs/cqrs';
import { Result } from '@common/result/result';
import { VerifyAccessTokenQuery } from '@auth/application/queries/verify-access-token/verify-access-token.query';
import { AccessTokenPayload } from '@auth/domain/types/access-token-payload.type';

@Injectable()
export class AuthIntegrationAdapter implements AuthIntegrationPort {
  constructor(private readonly queryBus: QueryBus) {}

  async verifyToken(token: string): Promise<Result<ValidatedTokenPayload>> {
    const res = await this.queryBus.execute<
      VerifyAccessTokenQuery,
      Result<AccessTokenPayload>
    >(new VerifyAccessTokenQuery(token));
    if (res.isError()) return Result.error(res.error);
    return Result.ok({
      sub: res.value.sub,
      role: res.value.role,
      exp: res.value.exp,
    });
  }
}
