import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
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
    this.logger.debug('authenticating user...');

    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket<any, any, any, ClientData>>();
    const data = wsContext.getData();

    if (client.data.authUser) {
      if (
        client.data.authUser.exp &&
        new Date().getTime() > client.data.authUser.exp * 1000
      ) {
        this.logger.warn(
          `Token expired for user: ${client.data.authUser.sub}.`,
        );
        this.handleExpiredSession(client, data);
        return false;
      }

      this.logger.verbose(
        `user already authenticated: ${client.data.authUser.sub}`,
      );
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

    this.logger.debug(`User authenticated: ${authRes.value.sub}`);
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

    const accessToken = this.extractToken(client);
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
    });
    client.data.authPromise = null;

    return Result.ok(verifyRes.value);
  }

  private extractToken(client: Socket): string {
    const token =
      client.request.headers.authorization ?? client.handshake.auth?.token;
    if (!token) {
      return null;
    }

    const splitToken = token.split(' ');
    if (splitToken.length !== 2 || splitToken[0] !== 'Bearer') {
      return null;
    }

    return splitToken[1];
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
