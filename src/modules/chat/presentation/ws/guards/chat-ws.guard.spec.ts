import { Test, TestingModule } from '@nestjs/testing';
import { ChatWsGuard } from './chat-ws.guard';
import { AuthIntegrationPort } from '@modules/chat/application/ports/auth-integration.port';

describe('ChatWsGuard', () => {
  let guard: ChatWsGuard;
  let authIntegrationPort: jest.Mocked<AuthIntegrationPort>;

  beforeEach(async () => {
    authIntegrationPort = {
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<AuthIntegrationPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatWsGuard,
        {
          provide: AuthIntegrationPort,
          useValue: authIntegrationPort,
        },
      ],
    }).compile();

    guard = module.get<ChatWsGuard>(ChatWsGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('verifyToken', () => {
    it('should call authIntegrationPort.verifyToken', async () => {
      const payload = { sub: 'user-1' };
      authIntegrationPort.verifyToken.mockResolvedValue(payload as any);

      const result = await (guard as any).verifyToken('valid-token');

      expect(authIntegrationPort.verifyToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(result).toEqual(payload);
    });
  });
});
