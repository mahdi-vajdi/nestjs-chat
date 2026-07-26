import { Test, TestingModule } from '@nestjs/testing';
import { UserUnblockedWsEventHandler } from './user-unblocked.ws-handler';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { UserUnblockedEvent } from '@modules/user/contracts/events';

describe('UserUnblockedWsEventHandler', () => {
  let handler: UserUnblockedWsEventHandler;
  let chatWsGateway: jest.Mocked<ChatWsGateway>;

  beforeEach(async () => {
    chatWsGateway = {
      server: {},
      serverBroadcast: jest.fn(),
    } as unknown as jest.Mocked<ChatWsGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserUnblockedWsEventHandler,
        { provide: ChatWsGateway, useValue: chatWsGateway },
      ],
    }).compile();

    handler = module.get<UserUnblockedWsEventHandler>(
      UserUnblockedWsEventHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should broadcast event to both users', async () => {
      const event = new UserUnblockedEvent('unblocker-1', 'unblocked-1');

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalled();
    });
  });
});
