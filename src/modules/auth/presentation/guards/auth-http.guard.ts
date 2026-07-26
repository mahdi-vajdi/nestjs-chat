import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { VerifyAccessTokenQuery } from '@modules/auth/application/queries/verify-access-token/verify-access-token.query';
import { BaseHttpAuthGuard } from '@common/http/guards/base-http-auth.guard';

@Injectable()
export class AuthHttpGuard extends BaseHttpAuthGuard {
  protected readonly logger = new Logger(AuthHttpGuard.name);

  constructor(private readonly queryBus: QueryBus) {
    super();
  }

  protected verifyToken(token: string) {
    return this.queryBus.execute(new VerifyAccessTokenQuery(token));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO: Check if token is not blacklisted
    const canActivate = await super.canActivate(context);
    // TODO: Check user role
    return canActivate;
  }
}
