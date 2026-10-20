import { Test, TestingModule } from '@nestjs/testing';
import { MessageEditedWsEventHandler } from './message-edited.ws-handler';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { MessageEditedDomainEvent } from '@modules/chat/contracts/events';
import { UserMessageEditedEvent } from '../message-edited.event';

describe('MessageEditedWsEventHandler', () => {
  let handler: MessageEditedWsEventHandler;
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
        MessageEditedWsEventHandler,
        { provide: ChatWsGateway, useValue: chatWsGateway },
        { provide: ConversationRepositoryPort, useValue: commandRepo },
      ],
    }).compile();

    handler = module.get<MessageEditedWsEventHandler>(
      MessageEditedWsEventHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('handle', () => {
    it('should broadcast message edit event to all members including sender for multi-device sync', async () => {
      const now = new Date();
      const event = new MessageEditedDomainEvent(
        'msg-1',
        'conv-1',
        'member-1',
        'edited text',
        [],
        now,
      );

      commandRepo.getConversationById.mockResolvedValue({
        id: 'conv-1',
        members: [
          { id: 'member-1', userId: 'user-1' },
          { id: 'member-2', userId: 'user-2' },
        ],
      } as any);

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-1', 'user-user-2'],
        expect.any(UserMessageEditedEvent),
      );

      const sentEvent = (chatWsGateway.serverBroadcast as jest.Mock).mock
        .calls[0][2];
      expect(sentEvent.eventName).toBe('conversation.message.edited');
      expect(sentEvent.data).toEqual({
        id: 'msg-1',
        conversationId: 'conv-1',
        content: 'edited text',
        editedAt: now.toISOString(),
      });
    });

    it('should exclude members who are in deletedForUserIds', async () => {
      const now = new Date();
      const event = new MessageEditedDomainEvent(
        'msg-1',
        'conv-1',
        'member-1',
        'edited text',
        ['user-2'],
        now,
      );

      commandRepo.getConversationById.mockResolvedValue({
        id: 'conv-1',
        members: [
          { id: 'member-1', userId: 'user-1' },
          { id: 'member-2', userId: 'user-2' },
        ],
      } as any);

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).toHaveBeenCalledWith(
        chatWsGateway.server,
        ['user-user-1'],
        expect.any(UserMessageEditedEvent),
      );
    });

    it('should return early when conversation is not found', async () => {
      commandRepo.getConversationById.mockResolvedValue(null);

      const event = new MessageEditedDomainEvent(
        'msg-1',
        'non-existent-conv',
        'member-1',
        'text',
        [],
        new Date(),
      );

      await handler.handle(event);

      expect(chatWsGateway.serverBroadcast).not.toHaveBeenCalled();
    });
  });
});
