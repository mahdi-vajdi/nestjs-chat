import { Test, TestingModule } from '@nestjs/testing';
import { AuthIntegrationAdapter } from './auth-integration.adapter';
import { QueryBus } from '@nestjs/cqrs';
import { VerifyAccessTokenQuery } from '@modules/auth/application/queries/verify-access-token/verify-access-token.query';

describe('AuthIntegrationAdapter', () => {
  let adapter: AuthIntegrationAdapter;
  let queryBusMock: any;

  beforeEach(async () => {
    queryBusMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthIntegrationAdapter,
        { provide: QueryBus, useValue: queryBusMock },
      ],
    }).compile();

    adapter = module.get<AuthIntegrationAdapter>(AuthIntegrationAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('verifyToken', () => {
    it('should execute VerifyAccessTokenQuery and return mapped payload', async () => {
      const mockPayload = {
        sub: 'user-1',
        role: 'user',
        exp: 123456789,
        iat: 123456,
        aud: 'aud',
        iss: 'iss',
      };
      queryBusMock.execute.mockResolvedValue(mockPayload);

      const result = await adapter.verifyToken('valid-token');

      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new VerifyAccessTokenQuery('valid-token'),
      );
      expect(result).toEqual({
        sub: 'user-1',
        role: 'user',
        exp: 123456789,
      });
    });
  });
});
