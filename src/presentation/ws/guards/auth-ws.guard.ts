import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IncomingMessage } from 'http';
import { Socket } from 'socket.io';
import { StdResponse } from '@common/std-response/std-response';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { AuthService } from '@auth/services/auth.service';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { AccessTokenPayload } from '@auth/types/access-token-payload.type';
import { ClientData } from '@presentation/ws/client-data.interface';

@Injectable()
export class AuthWsGuard implements CanActivate {
  private readonly logger = new Logger(AuthWsGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.verbose('authenticating user...');

    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket<any, any, any, ClientData>>();
    const data = wsContext.getData();

    if (client.data.authUser) {
      if (client.data.tokenExp && new Date().getTime() > client.data.tokenExp) {
        this.logger.warn(
          `Token expired for user: ${client.data.authUser.userId}.`,
        );
        this.handleExpiredSession(client, data);
        return false;
      }

      this.logger.verbose('user already authenticated');
      return true;
    }

    if (!client.data['authPromise']) {
      client.data['authPromise'] = this.authenticateUser(client);
    }

    const authRes: Result<AccessTokenPayload> =
      await client.data['authPromise'];
    if (authRes.isError()) {
      this.logger.debug(`Error from authentication: ${authRes.error.message}`);
      client.data['authPromise'] = null;
      if (typeof data.ack == 'function') {
        data.ack(StdResponse.fromResult(authRes));
      }
      return false;
    }

    this.logger.debug(`User authenticated: ${authRes.value.userId}`);
    return true;
  }

  @TryCatch
  async authenticateUser(client: Socket): Promise<Result<AccessTokenPayload>> {
    if (client.data.authUser) {
      this.logger.verbose(
        `user ${client.data.authUser.userId} already authenticated`,
      );
      return Result.ok(client.data.authUser);
    }

    const accessToken = this.extractToken(client.request);
    if (!accessToken) {
      this.logger.debug('token not provided');
      return Result.error('Unauthorized', ErrorCode.UNAUTHENTICATED);
    }

    const verifyRes = await this.authService.verifyAccessToken(accessToken);
    if (verifyRes.isError()) {
      this.logger.warn(
        `Error verifying access token: ${verifyRes.error.message}`,
      );
      return Result.error('Unauthorized', ErrorCode.UNAUTHENTICATED);
    }

    Object.assign(client.data, {
      authUser: verifyRes.value,
      accessToken: accessToken,
      tokenExp: verifyRes.value.exp * 1000, // Convert to milliseconds,
    });

    return Result.ok(verifyRes.value);
  }

  private extractToken(request: IncomingMessage): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : null;
  }

  private handleExpiredSession(
    client: Socket<any, any, any, ClientData>,
    data: any,
  ) {
    if (typeof data.ack == 'function') {
      data.ack(
        StdResponse.fromResult(
          Result.error('Unauthorized', ErrorCode.UNAUTHENTICATED),
        ),
      );
    }

    client.data = null;
    client.disconnect(true);
  }
}
