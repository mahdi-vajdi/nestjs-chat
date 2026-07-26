import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { authConfig } from '@modules/auth/infrastructure/config/auth.config';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let mockConfig: any;

  beforeEach(async () => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    mockConfig = {
      accessPrivateKey: 'access-priv',
      accessPublicKey: 'access-pub',
      refreshPrivateKey: 'refresh-priv',
      refreshPublicKey: 'refresh-pub',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: jwtService },
        { provide: authConfig.KEY, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  describe('signAccessToken', () => {
    it('should call jwtService.signAsync with correct payload and options', async () => {
      jwtService.signAsync.mockResolvedValue('signed-token');
      const result = await service.signAccessToken('user-1', 'admin');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1', role: 'admin' },
        { privateKey: 'access-priv', expiresIn: '1d' },
      );
      expect(result).toBe('signed-token');
    });
  });

  describe('signRefreshToken', () => {
    it('should generate jti and call jwtService.signAsync', async () => {
      jwtService.signAsync.mockResolvedValue('signed-refresh');
      const result = await service.signRefreshToken('user-1');

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1' },
        { privateKey: 'refresh-priv', expiresIn: '7d', jwtid: 'test-uuid' },
      );
      expect(result).toEqual({ token: 'signed-refresh', jti: 'test-uuid' });
    });
  });

  describe('verifyAccessToken', () => {
    it('should call jwtService.verifyAsync with correct options', async () => {
      jwtService.verifyAsync.mockResolvedValue({ payload: 'data' });
      const result = await service.verifyAccessToken('token-string');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-string', {
        publicKey: 'access-pub',
      });
      expect(result).toEqual({ payload: 'data' });
    });
  });

  describe('verifyRefreshToken', () => {
    it('should call jwtService.verifyAsync with correct options', async () => {
      jwtService.verifyAsync.mockResolvedValue({ payload: 'data' });
      const result = await service.verifyRefreshToken('token-string');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-string', {
        publicKey: 'refresh-pub',
      });
      expect(result).toEqual({ payload: 'data' });
    });
  });
});
