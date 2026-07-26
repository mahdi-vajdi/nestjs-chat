import { Test, TestingModule } from '@nestjs/testing';
import { MessageCreatedWsEventHandler } from './message-created.ws-handler';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import { QueryBus } from '@nestjs/cqrs';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageCreatedDomainEvent } from '@modules/chat/contracts/events';

describe('MessageCreatedWsEventHandler', () => {
  let handler: MessageCreatedWsEventHandler;
  let chatWsGateway: jest.Mocked<ChatWsGateway>;
  let userIntegrationPort: jest.Mocked<UserIntegrationPort>;
  let queryBus: jest.Mocked<QueryBus>;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;

  beforeEach(async () => {
    chatWsGateway = {
      server: {},
      serverBroadcast: jest.fn(),
    } as unknown as jest.Mocked<ChatWsGateway>;

    userIntegrationPort = {
      getUserById: jest.fn(),
    } as unknown as jest.Mocked<UserIntegrationPort>;

    queryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    commandRepo = {} as unknown as jest.Mocked<ConversationRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageCreatedWsEventHandler,
        { provide: ChatWsGateway, useValue: chatWsGateway },
        { provide: UserIntegrationPort, useValue: userIntegrationPort },
        { provide: QueryBus, useValue: queryBus },
        { provide: ConversationRepositoryPort, useValue: commandRepo },
      ],
    }).compile();

    handler = module.get<MessageCreatedWsEventHandler>(
      MessageCreatedWsEventHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should broadcast message to target user room', async () => {
      const event = new MessageCreatedDomainEvent(
        'msg-1',
        'conv-1',
        'member-1',
        'hello',
        [],
        new Date(),
      );

      commandRepo.getConversationById = jest.fn().mockResolvedValue({
        id: 'conv-1',
        members: [
          { id: 'member-1', userId: 'user-1' },
          { id: 'member-2', userId: 'user-2' },
        ],
      });

      queryBus.execute.mockResolvedValue({
        id: 'conv-1',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });

      userIntegrationPort.getUserById.mockImplementation(
        async (id) =>
          ({
            id,
            username: `username-${id}`,
            firstName: 'First',
            lastName: 'Last',
            avatar: null,
          }) as any,
      );

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalled();
    });
  });
});
