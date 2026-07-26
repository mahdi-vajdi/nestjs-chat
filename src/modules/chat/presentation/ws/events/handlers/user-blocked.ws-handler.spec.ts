import { Test, TestingModule } from '@nestjs/testing';
import { UserBlockedWsEventHandler } from './user-blocked.ws-handler';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { UserBlockedEvent } from '@modules/user/contracts/events';

describe('UserBlockedWsEventHandler', () => {
  let handler: UserBlockedWsEventHandler;
  let chatWsGateway: jest.Mocked<ChatWsGateway>;

  beforeEach(async () => {
    chatWsGateway = {
      server: {},
      serverBroadcast: jest.fn(),
    } as unknown as jest.Mocked<ChatWsGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserBlockedWsEventHandler,
        { provide: ChatWsGateway, useValue: chatWsGateway },
      ],
    }).compile();

    handler = module.get<UserBlockedWsEventHandler>(UserBlockedWsEventHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should broadcast event to both users', async () => {
      const event = new UserBlockedEvent('blocker-1', 'blocked-1');

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalled();
    });
  });
});
