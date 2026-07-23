import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { QueryBus } from '@nestjs/cqrs';
import { VerifyAccessTokenQuery } from '@auth/application/queries/verify-access-token/verify-access-token.query';
import { AccessTokenPayload } from '@auth/domain/types/access-token-payload.type';

@Injectable()
export class AuthHttpGuard implements CanActivate {
  private readonly logger = new Logger(AuthHttpGuard.name);

  constructor(private readonly queryBus: QueryBus) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO: Check if token is not blacklisted

    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      this.logger.log('User did not provide access token. retuning error.');
      throw new UnauthorizedException('No access token was provided.');
    }

    try {
      const verifyTokenRes = await this.queryBus.execute<
        VerifyAccessTokenQuery,
        AccessTokenPayload
      >(new VerifyAccessTokenQuery(accessToken));

      Object.assign(request, {
        authUser: verifyTokenRes,
        accessToken: accessToken,
      });
    } catch (e) {
      this.logger.warn(`Error verifying access token: ${(e as any).message}`);
      throw new UnauthorizedException('Invalid access token.');
    }

    // TODO: Check user role

    return true;
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }
}
