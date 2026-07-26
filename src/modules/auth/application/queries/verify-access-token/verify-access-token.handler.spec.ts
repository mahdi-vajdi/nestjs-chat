import { Test, TestingModule } from '@nestjs/testing';
import { VerifyAccessTokenHandler } from './verify-access-token.handler';
import { VerifyAccessTokenQuery } from './verify-access-token.query';
import { TokenService } from '@modules/auth/application/services/token.service';
import { AccessTokenPayload } from '@modules/auth/domain/types/access-token-payload.type';
import { UnauthorizedException } from '@nestjs/common';

describe('VerifyAccessTokenHandler', () => {
  let handler: VerifyAccessTokenHandler;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    tokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyAccessTokenHandler,
        {
          provide: TokenService,
          useValue: tokenService,
        },
      ],
    }).compile();

    handler = module.get<VerifyAccessTokenHandler>(VerifyAccessTokenHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return the token payload if verification succeeds', async () => {
      const query = new VerifyAccessTokenQuery('valid-token');
      const payload: AccessTokenPayload = {
        sub: 'user-1',
        role: 'user',
        iat: 1,
        exp: 2,
        aud: 'aud',
        iss: 'iss',
      };

      tokenService.verifyAccessToken.mockResolvedValue(payload);

      const result = await handler.execute(query);

      expect(tokenService.verifyAccessToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException if verification fails', async () => {
      const query = new VerifyAccessTokenQuery('invalid-token');

      tokenService.verifyAccessToken.mockRejectedValue(
        new Error('Invalid token'),
      );

      await expect(handler.execute(query)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
