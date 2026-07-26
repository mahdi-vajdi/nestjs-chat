import { CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { ClientData } from '@common/websocket/interfaces/client-data.interface';

export abstract class BaseWsAuthGuard implements CanActivate {
  protected abstract readonly logger: Logger;

  protected abstract verifyToken(token: string): Promise<any>;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('authenticating user...');

    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket<any, any, any, ClientData>>();
    const data = wsContext.getData();

    if (client.data.authUser) {
      if (
        client.data.authUser.exp &&
        Date.now() > client.data.authUser.exp * 1000
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

    if (!client.data.authPromise) {
      client.data.authPromise = this.authenticateUser(client);
    }

    try {
      const authPayload = await client.data.authPromise;
      this.logger.debug(`User authenticated: ${authPayload.sub}`);
      return true;
    } catch (e) {
      this.logger.debug(`Error from authentication: ${(e as Error).message}`);
      client.data.authPromise = null;
      if (data && typeof data.ack === 'function') {
        data.ack({ error: 'Unauthorized', statusCode: 401 });
      }
      throw new WsException({
        code: 'UNAUTHENTICATED',
        message: (e as Error).message,
      });
    }
  }

  public async authenticateUser(client: Socket): Promise<any> {
    if (client.data.authUser) {
      return client.data.authUser;
    }

    const accessToken = this.extractToken(client);
    if (!accessToken) throw new WsException('Unauthorized');

    try {
      const verifyRes = await this.verifyToken(accessToken);
      Object.assign(client.data, {
        authUser: verifyRes,
        accessToken: accessToken,
      });
      client.data.authPromise = null;
      return verifyRes;
    } catch (e) {
      this.logger.warn(`Error verifying access token: ${(e as Error).message}`);
      throw new WsException('Unauthorized');
    }
  }

  private extractToken(client: Socket): string | null {
    const token =
      client.request.headers.authorization ?? client.handshake.auth?.token;
    const [type, tokenValue] = token?.split(' ') ?? [];
    return type === 'Bearer' ? tokenValue : null;
  }

  private handleExpiredSession(
    client: Socket<any, any, any, ClientData>,
    data: any,
  ) {
    if (data && typeof data.ack === 'function') {
      data.ack({ error: 'Unauthorized', statusCode: 401 });
    }
    client.data = null;
    client.disconnect(true);
    throw new WsException({ code: 'UNAUTHENTICATED', message: 'Unauthorized' });
  }
}
