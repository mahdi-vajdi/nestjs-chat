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
    it('should broadcast message to target user room and sender room for multi-device sync', async () => {
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

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-2', 'user-user-1'],
        expect.anything(),
      );
    });

    it('should not broadcast to target user room if target user is in deletedForUserIds', async () => {
      const event = new MessageCreatedDomainEvent(
        'msg-1',
        'conv-1',
        'member-1',
        'hello',
        ['user-2'],
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

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-1'],
        expect.anything(),
      );
    });

    it('should broadcast message with replyTo preview when replyToMessageId is present', async () => {
      const event = new MessageCreatedDomainEvent(
        'child-msg-1',
        'conv-1',
        'member-2',
        'Replying back',
        [],
        new Date(),
        'parent-msg-1',
      );

      commandRepo.getConversationById = jest.fn().mockResolvedValue({
        id: 'conv-1',
        members: [
          { id: 'member-1', userId: 'user-1' },
          { id: 'member-2', userId: 'user-2' },
        ],
      });

      commandRepo.getMessageById = jest.fn().mockResolvedValue({
        id: 'parent-msg-1',
        senderId: 'member-1',
        text: 'Initial question',
        createdAt: new Date(),
        deletedAt: null,
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

      expect(commandRepo.getMessageById).toHaveBeenCalledWith('parent-msg-1');
      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-1', 'user-user-2'],
        expect.objectContaining({
          data: expect.objectContaining({
            replyToMessageId: 'parent-msg-1',
            replyTo: expect.objectContaining({
              id: 'parent-msg-1',
              content: 'Initial question',
              senderId: 'user-1',
            }),
          }),
        }),
      );
    });
  });
});
