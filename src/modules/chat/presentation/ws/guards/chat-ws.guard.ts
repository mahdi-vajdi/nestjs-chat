import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';

import {
  AuthIntegrationPort,
  ValidatedTokenPayload,
} from '@modules/chat/application/ports/auth-integration.port';
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

    try {
      const authPayload = await client.data['authPromise'];
      this.logger.debug(`User authenticated: ${authPayload.sub}`);
      return true;
    } catch (e) {
      this.logger.debug(`Error from authentication: ${(e as Error).message}`);
      client.data['authPromise'] = null;
      throw new WsException({
        code: 'UNAUTHENTICATED',
        message: (e as Error).message,
      });
    }
  }

  async authenticateUser(client: Socket): Promise<ValidatedTokenPayload> {
    if (client.data.authUser) {
      this.logger.verbose(
        `user ${client.data.authUser.sub} already authenticated`,
      );
      return client.data.authUser;
    }

    const accessToken = this.extractToken(client);
    if (!accessToken) {
      this.logger.debug('token not provided');
      throw new Error('Unauthorized');
    }

    try {
      const verifyRes = await this.authIntegrationPort.verifyToken(accessToken);

      Object.assign(client.data, {
        authUser: verifyRes,
        accessToken: accessToken,
      });
      client.data.authPromise = null;

      return verifyRes;
    } catch (e) {
      this.logger.warn(`Error verifying access token: ${(e as Error).message}`);
      throw new Error('Unauthorized', { cause: e });
    }
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
      code: 'UNAUTHENTICATED',
      message: 'Unauthorized',
    });
  }
}
