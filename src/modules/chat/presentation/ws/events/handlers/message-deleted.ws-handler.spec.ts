import { Test, TestingModule } from '@nestjs/testing';
import { MessageDeletedWsEventHandler } from './message-deleted.ws-handler';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageDeletedDomainEvent } from '@modules/chat/contracts/events';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';
import { UserMessageDeletedEvent } from '../message-deleted.event';

describe('MessageDeletedWsEventHandler', () => {
  let handler: MessageDeletedWsEventHandler;
  let chatWsGateway: jest.Mocked<ChatWsGateway>;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;

  beforeEach(async () => {
    chatWsGateway = {
      server: {},
      serverBroadcast: jest.fn(),
    } as unknown as jest.Mocked<ChatWsGateway>;

    commandRepo = {
      getConversationById: jest.fn(),
    } as unknown as jest.Mocked<ConversationRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageDeletedWsEventHandler,
        { provide: ChatWsGateway, useValue: chatWsGateway },
        { provide: ConversationRepositoryPort, useValue: commandRepo },
      ],
    }).compile();

    handler = module.get<MessageDeletedWsEventHandler>(
      MessageDeletedWsEventHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should broadcast to actor user room only when scope is ME', async () => {
      const event = new MessageDeletedDomainEvent(
        'msg-1',
        'conv-1',
        MessageDeleteScope.ME,
        'user-1',
        ['user-1'],
      );

      await handler.handle(event);

      expect(commandRepo.getConversationById).not.toHaveBeenCalled();
      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-1'],
        expect.any(UserMessageDeletedEvent),
      );

      const sentEvent = (chatWsGateway.serverBroadcast as jest.Mock).mock
        .calls[0][2];
      expect(sentEvent.eventName).toBe('conversation.message.deleted');
      expect(sentEvent.data).toEqual({
        id: 'msg-1',
        conversationId: 'conv-1',
        scope: MessageDeleteScope.ME,
        deletedAt: undefined,
      });
    });

    it('should broadcast to all non-deleted members when scope is EVERYONE', async () => {
      const now = new Date();
      const event = new MessageDeletedDomainEvent(
        'msg-1',
        'conv-1',
        MessageDeleteScope.EVERYONE,
        'user-1',
        ['user-2'],
        now,
      );

      commandRepo.getConversationById.mockResolvedValue({
        id: 'conv-1',
        members: [
          { id: 'member-1', userId: 'user-1' },
          { id: 'member-2', userId: 'user-2' },
          { id: 'member-3', userId: 'user-3' },
        ],
      } as any);

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-1', 'user-user-3'],
        expect.any(UserMessageDeletedEvent),
      );

      const sentEvent = (chatWsGateway.serverBroadcast as jest.Mock).mock
        .calls[0][2];
      expect(sentEvent.eventName).toBe('conversation.message.deleted');
      expect(sentEvent.data).toEqual({
        id: 'msg-1',
        conversationId: 'conv-1',
        scope: MessageDeleteScope.EVERYONE,
        deletedAt: now.toISOString(),
      });
    });

    it('should return early when conversation is not found for EVERYONE scope', async () => {
      commandRepo.getConversationById.mockResolvedValue(null);

      const event = new MessageDeletedDomainEvent(
        'msg-1',
        'non-existent-conv',
        MessageDeleteScope.EVERYONE,
        'user-1',
        [],
        new Date(),
      );

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).not.toHaveBeenCalled();
    });
  });
});
