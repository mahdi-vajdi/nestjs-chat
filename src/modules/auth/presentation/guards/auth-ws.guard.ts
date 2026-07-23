import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Socket } from 'socket.io';
import { QueryBus } from '@nestjs/cqrs';
import { VerifyAccessTokenQuery } from '@auth/application/queries/verify-access-token/verify-access-token.query';
import { AccessTokenPayload } from '@auth/domain/types/access-token-payload.type';
import { WsException } from '@nestjs/websockets';
import { ClientData } from '@common/websocket/interfaces/client-data.interface';

@Injectable()
export class AuthWsGuard implements CanActivate {
  private readonly logger = new Logger(AuthWsGuard.name);

  constructor(private readonly queryBus: QueryBus) {}

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

    try {
      const authRes = await client.data['authPromise'];
      this.logger.debug(`User authenticated: ${authRes.sub}`);
      return true;
    } catch (e) {
      this.logger.debug(`Error from authentication: ${(e as any).message}`);
      client.data['authPromise'] = null;
      if (typeof data.ack == 'function') {
        data.ack({ error: 'Unauthorized', statusCode: 401 }); // Using simple error instead of StdResponse
      }
      return false;
    }
  }

  async authenticateUser(client: Socket): Promise<AccessTokenPayload> {
    if (client.data.authUser) {
      this.logger.verbose(
        `user ${client.data.authUser.userId} already authenticated`,
      );
      return client.data.authUser;
    }

    const accessToken = this.extractToken(client);
    if (!accessToken) {
      this.logger.debug('token not provided');
      throw new WsException('Unauthorized');
    }

    try {
      const verifyRes = await this.queryBus.execute<
        VerifyAccessTokenQuery,
        AccessTokenPayload
      >(new VerifyAccessTokenQuery(accessToken));

      Object.assign(client.data, {
        authUser: verifyRes,
        accessToken: accessToken,
      });
      client.data.authPromise = null;

      return verifyRes;
    } catch (e) {
      this.logger.warn(`Error verifying access token: ${(e as any).message}`);
      throw new WsException('Unauthorized');
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

  private handleExpiredSession(
    client: Socket<any, any, any, ClientData>,
    data: any,
  ) {
    if (typeof data.ack == 'function') {
      data.ack({ error: 'Unauthorized', statusCode: 401 });
    }

    client.data = null;
    client.disconnect(true);
  }
}
