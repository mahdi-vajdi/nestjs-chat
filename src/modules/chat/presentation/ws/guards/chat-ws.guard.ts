import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';

import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import {
  AuthIntegrationPort,
  ValidatedTokenPayload,
} from '@chat/application/ports/auth-integration.port';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { ClientData } from '@common/websocket/interfaces/client-data.interface';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatWsGuard implements CanActivate {
  private readonly logger = new Logger(ChatWsGuard.name);

  constructor(private readonly authIntegrationPort: AuthIntegrationPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('authenticating user...');

    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket<any, any, any, ClientData>>();

    if (client.data.authUser) {
      if (
        client.data.authUser.exp &&
        new Date().getTime() > client.data.authUser.exp * 1000
      ) {
        this.logger.warn(
          `Token expired for user: ${client.data.authUser.sub}.`,
        );
        this.handleExpiredSession(client);
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

    const authRes: Result<ValidatedTokenPayload> =
      await client.data['authPromise'];
    if (authRes.isError()) {
      this.logger.debug(`Error from authentication: ${authRes.error.message}`);
      client.data['authPromise'] = null;
      throw new WsException({
        code: ErrorCode.UNAUTHENTICATED,
        message: authRes.error.message,
      });
    }

    this.logger.debug(`User authenticated: ${authRes.value.sub}`);
    return true;
  }

  @TryCatch
  async authenticateUser(
    client: Socket,
  ): Promise<Result<ValidatedTokenPayload>> {
    if (client.data.authUser) {
      this.logger.verbose(
        `user ${client.data.authUser.sub} already authenticated`,
      );
      return Result.ok(client.data.authUser);
    }

    const accessToken = this.extractToken(client);
    if (!accessToken) {
      this.logger.debug('token not provided');
      return Result.error('Unauthorized', ErrorCode.UNAUTHENTICATED);
    }

    const verifyRes = await this.authIntegrationPort.verifyToken(accessToken);
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

  private handleExpiredSession(client: Socket<any, any, any, ClientData>) {
    client.data = null;
    client.disconnect(true);
    throw new WsException({
      code: ErrorCode.UNAUTHENTICATED,
      message: 'Unauthorized',
    });
  }
}
