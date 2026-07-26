import { Test, TestingModule } from '@nestjs/testing';
import { AuthHttpGuard } from './auth-http.guard';
import { QueryBus } from '@nestjs/cqrs';
import { VerifyAccessTokenQuery } from '@modules/auth/application/queries/verify-access-token/verify-access-token.query';

describe('AuthHttpGuard', () => {
  let guard: AuthHttpGuard;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    queryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthHttpGuard,
        {
          provide: QueryBus,
          useValue: queryBus,
        },
      ],
    }).compile();

    guard = module.get<AuthHttpGuard>(AuthHttpGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('verifyToken', () => {
    it('should execute VerifyAccessTokenQuery', async () => {
      const payload = { sub: 'user-1' };
      queryBus.execute.mockResolvedValue(payload);

      const result = await (guard as any).verifyToken('valid-token');

      expect(queryBus.execute).toHaveBeenCalledWith(
        new VerifyAccessTokenQuery('valid-token'),
      );
      expect(result).toEqual(payload);
    });
  });

  describe('canActivate', () => {
    it('should call super.canActivate', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer valid-token' },
          }),
        }),
      } as any;

      queryBus.execute.mockResolvedValue({ sub: 'user-1' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
