import { Injectable } from '@nestjs/common';
import {
  AuthIntegrationPort,
  ValidatedTokenPayload,
} from '@user/application/ports/auth-integration.port';
import { QueryBus } from '@nestjs/cqrs';

import { VerifyAccessTokenQuery } from '@auth/application/queries/verify-access-token/verify-access-token.query';
import { AccessTokenPayload } from '@auth/domain/types/access-token-payload.type';

@Injectable()
export class AuthIntegrationAdapter implements AuthIntegrationPort {
  constructor(private readonly queryBus: QueryBus) {}

  async verifyToken(token: string): Promise<ValidatedTokenPayload> {
    const payload = await this.queryBus.execute<
      VerifyAccessTokenQuery,
      AccessTokenPayload
    >(new VerifyAccessTokenQuery(token));

    return {
      sub: payload.sub,
      role: payload.role,
    };
  }
}
