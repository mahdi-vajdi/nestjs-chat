import { Test, TestingModule } from '@nestjs/testing';
import { AuthWsGuard } from './auth-ws.guard';
import { QueryBus } from '@nestjs/cqrs';
import { WsException } from '@nestjs/websockets';
import { VerifyAccessTokenQuery } from '@modules/auth/application/queries/verify-access-token/verify-access-token.query';

describe('AuthWsGuard', () => {
  let guard: AuthWsGuard;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    queryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthWsGuard, { provide: QueryBus, useValue: queryBus }],
    }).compile();

    guard = module.get<AuthWsGuard>(AuthWsGuard);
  });

  describe('verifyToken', () => {
    it('should call query bus with VerifyAccessTokenQuery', async () => {
      queryBus.execute.mockResolvedValue({ sub: 'user-1' });
      const result = await guard['verifyToken']('valid-token');
      expect(queryBus.execute).toHaveBeenCalledWith(
        new VerifyAccessTokenQuery('valid-token'),
      );
      expect(result).toEqual({ sub: 'user-1' });
    });
  });

  describe('authenticateUser', () => {
    it('should throw WsException if no token is provided', async () => {
      const client = {
        handshake: { auth: {} },
        request: { headers: {} },
        data: {},
      } as any;

      await expect(guard.authenticateUser(client)).rejects.toThrow(WsException);
    });

    it('should throw WsException if token verification fails', async () => {
      const client = {
        handshake: { auth: { token: 'Bearer invalid-token' } },
        request: { headers: {} },
        data: {},
      } as any;

      queryBus.execute.mockRejectedValue(new Error());

      await expect(guard.authenticateUser(client)).rejects.toThrow(WsException);
    });
  });
});
