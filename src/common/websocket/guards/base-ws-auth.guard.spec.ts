import { BaseWsAuthGuard } from './base-ws-auth.guard';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

class TestWsGuard extends BaseWsAuthGuard {
  protected readonly logger = new Logger('TestWsGuard');
  protected verifyToken = jest.fn().mockResolvedValue({ sub: 'user-1' });

  async authenticateUser(client: Socket): Promise<any> {
    if (client.handshake.auth.token === 'valid') {
      return { sub: 'user-1' };
    }
    throw new WsException('auth failed');
  }
}

describe('BaseWsAuthGuard', () => {
  let guard: TestWsGuard;

  beforeEach(() => {
    guard = new TestWsGuard();
  });

  describe('canActivate', () => {
    it('should return true if client data has authPromise resolving successfully', async () => {
      const context = {
        switchToWs: () => ({
          getClient: () => ({
            data: { authPromise: Promise.resolve({ sub: 'user-1' }) },
          }),
          getData: () => ({}),
        }),
        getHandler: () => ({}),
      } as any;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should call authenticateUser if authPromise is absent and return true', async () => {
      const client = {
        handshake: { auth: { token: 'valid' } },
        data: {},
      };
      const context = {
        switchToWs: () => ({
          getClient: () => client,
          getData: () => ({}),
        }),
        getHandler: () => ({}),
      } as any;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(client.data['authPromise']).toBeDefined();
    });

    it('should throw WsException if authentication fails', async () => {
      const context = {
        switchToWs: () => ({
          getClient: () => ({
            handshake: { auth: { token: 'invalid' } },
            data: {},
          }),
          getData: () => ({}),
        }),
        getHandler: () => ({}),
      } as any;

      await expect(guard.canActivate(context)).rejects.toThrow(WsException);
    });
  });
});
