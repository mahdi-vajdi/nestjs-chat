import { Test, TestingModule } from '@nestjs/testing';
import { ChatWsGateway } from './chat-ws.gateway';
import { ChatWsGuard } from './guards/chat-ws.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import { Server } from 'socket.io';
import { AuthIntegrationPort } from '@modules/chat/application/ports/auth-integration.port';
import { WsException } from '@nestjs/websockets';
import { ConversationType } from '@modules/chat/domain/enums/conversation-type.enum';
import { DeleteConversationCommand } from '@modules/chat/application/commands/delete-conversation/delete-conversation.command';

describe('ChatWsGateway', () => {
  let gateway: ChatWsGateway;
  let chatWsGuard: jest.Mocked<ChatWsGuard>;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let userIntegrationPort: jest.Mocked<UserIntegrationPort>;

  beforeEach(async () => {
    chatWsGuard = {
      authenticateUser: jest.fn(),
      canActivate: jest.fn(),
    } as unknown as jest.Mocked<ChatWsGuard>;

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    userIntegrationPort = {
      getUserById: jest.fn(),
      getBlockStatus: jest.fn(),
      getUserIdsByNameOrUsername: jest.fn(),
      getUsersByIds: jest.fn(),
      getBlockedUsersIds: jest.fn(),
    } as unknown as jest.Mocked<UserIntegrationPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatWsGateway,
        { provide: ChatWsGuard, useValue: chatWsGuard },
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: UserIntegrationPort, useValue: userIntegrationPort },
        { provide: AuthIntegrationPort, useValue: {} },
      ],
    })
      .overrideGuard(ChatWsGuard)
      .useValue(chatWsGuard)
      .compile();

    gateway = module.get<ChatWsGateway>(ChatWsGateway);
    gateway.server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as unknown as Server;
    gateway.broadcast = jest.fn();
  });

  describe('afterInit', () => {
    it('should run without error', () => {
      expect(() => gateway.afterInit()).not.toThrow();
    });
  });

  describe('createDirectConversation', () => {
    it('should throw if target user is blocked', async () => {
      userIntegrationPort.getUserById.mockResolvedValueOnce({
        id: 'user-1',
      } as any);
      userIntegrationPort.getUserById.mockResolvedValueOnce({
        id: 'user-2',
      } as any);
      userIntegrationPort.getBlockStatus.mockResolvedValue({
        isBlocker: true,
        isBlocked: false,
      });

      await expect(
        gateway.createDirectConversation(
          {} as any,
          { targetUserId: 'user-2', content: 'hello' },
          'user-1',
        ),
      ).rejects.toThrow(WsException);
    });

    it('should create conversation, broadcast, and return result', async () => {
      userIntegrationPort.getUserById.mockResolvedValueOnce({
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
      } as any);
      userIntegrationPort.getUserById.mockResolvedValueOnce({
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
        username: 'janesmith',
      } as any);
      userIntegrationPort.getBlockStatus.mockResolvedValue({
        isBlocker: false,
        isBlocked: false,
      });

      commandBus.execute
        .mockResolvedValueOnce({ id: 'conv-1', identifier: 'test-ident' }) // create conversation
        .mockResolvedValueOnce({
          id: 'msg-1',
          text: 'hello',
          createdAt: new Date(),
          deletedForUserIds: [],
          conversation: { id: 'conv-1' },
          conversationId: 'conv-1',
        }); // create message

      const result = await gateway.createDirectConversation(
        {} as any,
        { targetUserId: 'user-2', content: 'hello' },
        'user-1',
      );
      expect(result.id).toBe('conv-1');
      expect(gateway.broadcast).toHaveBeenCalled();
    });

    it('should rollback conversation if message creation fails', async () => {
      userIntegrationPort.getUserById.mockResolvedValue({
        id: 'user-1',
      } as any);
      userIntegrationPort.getBlockStatus.mockResolvedValue({
        isBlocker: false,
        isBlocked: false,
      });

      commandBus.execute
        .mockResolvedValueOnce({ id: 'conv-1' })
        .mockRejectedValueOnce(new Error('fail msg'));

      await expect(
        gateway.createDirectConversation(
          {} as any,
          { targetUserId: 'user-2', content: 'hello' },
          'user-1',
        ),
      ).rejects.toThrow('fail msg');

      expect(commandBus.execute).toHaveBeenCalledWith(
        new DeleteConversationCommand('conv-1'),
      );
    });
  });

  describe('getUserConversationList', () => {
    it('should return paginated and mapped conversations', async () => {
      queryBus.execute.mockResolvedValue({
        meta: { total: 1, page: 1, pageSize: 10 },
        data: [
          {
            id: 'conv-1',
            type: ConversationType.DIRECT,
            members: [
              { userId: 'user-1', notSeenCount: 0 },
              { userId: 'user-2' },
            ],
            lastMessage: {
              id: 'msg-1',
              senderId: 'user-1',
              createdAt: new Date(),
            },
          },
        ],
      });

      userIntegrationPort.getUsersByIds.mockResolvedValue([
        { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janes',
        },
      ] as any);

      const result = await gateway.getUserConversationList(
        { page: 1, pageSize: 10, targetUserId: 'other' } as any,
        'user-1',
      );
      expect(result.data[0].id).toBe('conv-1');
      expect(result.data[0].title).toBe('Jane Smith');
      expect(result.data[0].identifier).toBe('janes');
    });

    it('should filter by username', async () => {
      userIntegrationPort.getUserIdsByNameOrUsername.mockResolvedValue([
        'user-2',
      ]);
      queryBus.execute.mockResolvedValue({ meta: {}, data: [] });
      userIntegrationPort.getUsersByIds.mockResolvedValue([]);

      await gateway.getUserConversationList(
        { page: 1, pageSize: 10, filter: 'jan', targetUserId: 'other' } as any,
        'user-1',
      );
      expect(
        userIntegrationPort.getUserIdsByNameOrUsername,
      ).toHaveBeenCalledWith('jan');
    });

    it('should return empty if filter resolves to 0 users', async () => {
      userIntegrationPort.getUserIdsByNameOrUsername.mockResolvedValue([]);
      queryBus.execute.mockResolvedValue({ meta: {}, data: [] });
      const result = await gateway.getUserConversationList(
        { page: 1, pageSize: 10, filter: 'jan', targetUserId: 'other' } as any,
        'user-1',
      );
      expect(result.data).toEqual([]);
    });

    it('should compute seen status for own and received messages in direct conversation', async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);
      const later = new Date(now.getTime() + 60000);

      queryBus.execute.mockResolvedValue({
        meta: { total: 2, page: 1, pageSize: 10 },
        data: [
          {
            id: 'conv-seen',
            type: ConversationType.DIRECT,
            notSeenCount: 0,
            members: [
              {
                userId: 'user-1',
                lastSeenMessage: { createdAt: later.toISOString() },
              },
              {
                userId: 'user-2',
                lastSeenMessage: { createdAt: later.toISOString() },
              },
            ],
            lastMessage: {
              id: 'msg-seen',
              senderId: 'user-1',
              createdAt: now.toISOString(),
            },
          },
          {
            id: 'conv-unseen',
            type: ConversationType.DIRECT,
            notSeenCount: 1,
            members: [
              {
                userId: 'user-1',
                lastSeenMessage: { createdAt: earlier.toISOString() },
              },
              {
                userId: 'user-2',
                lastSeenMessage: { createdAt: earlier.toISOString() },
              },
            ],
            lastMessage: {
              id: 'msg-unseen',
              senderId: 'user-1',
              createdAt: now.toISOString(),
            },
          },
        ],
      });

      userIntegrationPort.getUsersByIds.mockResolvedValue([
        { id: 'user-1', firstName: 'John', lastName: 'Doe', username: 'john' },
        {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'jane',
        },
      ] as any);

      const result = await gateway.getUserConversationList(
        { page: 1, pageSize: 10 } as any,
        'user-1',
      );

      expect(result.data[0].lastMessage?.seen).toBe(true);
      expect(result.data[1].lastMessage?.seen).toBe(false);
    });

    it('should compute seen: false for own message in group conversation', async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 60000);

      queryBus.execute.mockResolvedValue({
        meta: { total: 1, page: 1, pageSize: 10 },
        data: [
          {
            id: 'conv-group',
            type: 'GROUP' as any,
            title: 'Group Chat',
            notSeenCount: 0,
            members: [
              {
                userId: 'user-1',
                lastSeenMessage: { createdAt: later.toISOString() },
              },
              {
                userId: 'user-2',
                lastSeenMessage: { createdAt: later.toISOString() },
              },
            ],
            lastMessage: {
              id: 'msg-group',
              senderId: 'user-1',
              createdAt: now.toISOString(),
            },
          },
        ],
      });

      userIntegrationPort.getUsersByIds.mockResolvedValue([
        { id: 'user-1', firstName: 'John', lastName: 'Doe', username: 'john' },
      ] as any);

      const result = await gateway.getUserConversationList(
        { page: 1, pageSize: 10 } as any,
        'user-1',
      );

      expect(result.data[0].lastMessage?.seen).toBe(false);
    });
  });

  describe('createMessage', () => {
    it('should throw if target is blocked', async () => {
      queryBus.execute.mockResolvedValue({
        id: 'conv-1',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });
      userIntegrationPort.getUserById.mockResolvedValue({
        id: 'user-1',
      } as any);
      userIntegrationPort.getBlockStatus.mockResolvedValue({
        isBlocker: true,
        isBlocked: false,
      });

      await expect(
        gateway.createMessage(
          {} as any,
          { conversationId: 'conv-1', text: 'hi' },
          'user-1',
        ),
      ).rejects.toThrow(WsException);
    });

    it('should create message', async () => {
      queryBus.execute.mockResolvedValue({
        id: 'conv-1',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });
      userIntegrationPort.getUserById.mockResolvedValue({
        id: 'user-1',
        firstName: 'J',
      } as any);
      userIntegrationPort.getBlockStatus.mockResolvedValue({
        isBlocker: false,
        isBlocked: false,
      });
      commandBus.execute.mockResolvedValue({
        id: 'msg-1',
        createdAt: new Date(),
        text: 'hi',
      });

      const result = await gateway.createMessage(
        {} as any,
        { conversationId: 'conv-1', text: 'hi' },
        'user-1',
      );
      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('hi');
    });

    it('should throw if conversation missing target member', async () => {
      queryBus.execute.mockResolvedValue({
        id: 'conv-1',
        members: [{ userId: 'user-1' }],
      });
      await expect(
        gateway.createMessage(
          {} as any,
          { conversationId: 'conv-1', text: 'hi' },
          'user-1',
        ),
      ).rejects.toThrow(WsException);
    });
  });

  describe('getConversationMessageList', () => {
    it('should return mapped messages and members', async () => {
      queryBus.execute
        .mockResolvedValueOnce({
          id: 'conv-1',
          type: ConversationType.DIRECT,
          members: [
            { userId: 'user-1', lastSeenMessage: { createdAt: new Date() } },
            { userId: 'user-2', lastSeenMessage: { createdAt: new Date() } },
          ],
        })
        .mockResolvedValueOnce({
          meta: { total: 1, page: 1, pageSize: 10 },
          data: [
            {
              id: 'msg-1',
              senderId: 'user-1',
              text: 'hi',
              createdAt: new Date(),
            },
          ],
        });

      userIntegrationPort.getUsersByIds.mockResolvedValue([
        { id: 'user-1', firstName: 'J' },
        { id: 'user-2', firstName: 'M' },
      ] as any);
      userIntegrationPort.getBlockedUsersIds.mockResolvedValue([]);

      const result = await gateway.getConversationMessageList(
        {} as any,
        { conversationId: 'conv-1', page: 1, pageSize: 10 },
        'user-1',
      );
      expect(result.messages.list[0].id).toBe('msg-1');
      expect(result.members).toHaveLength(1); // excluding authUserId
    });

    it('should compute seen status correctly for own and received messages', async () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 60000);
      const later = new Date(now.getTime() + 60000);

      queryBus.execute
        .mockResolvedValueOnce({
          id: 'conv-1',
          type: ConversationType.DIRECT,
          members: [
            {
              userId: 'user-1',
              lastSeenMessage: { createdAt: later.toISOString() },
            },
            {
              userId: 'user-2',
              lastSeenMessage: { createdAt: earlier.toISOString() },
            },
          ],
        })
        .mockResolvedValueOnce({
          meta: { total: 2, page: 1, pageSize: 10 },
          data: [
            {
              id: 'msg-own',
              senderId: 'user-1',
              text: 'my message',
              createdAt: now.toISOString(),
            },
            {
              id: 'msg-received',
              senderId: 'user-2',
              text: 'their message',
              createdAt: now.toISOString(),
            },
          ],
        });

      userIntegrationPort.getUsersByIds.mockResolvedValue([
        { id: 'user-1', firstName: 'Me' },
        { id: 'user-2', firstName: 'Other' },
      ] as any);
      userIntegrationPort.getBlockedUsersIds.mockResolvedValue([]);

      const result = await gateway.getConversationMessageList(
        {} as any,
        { conversationId: 'conv-1', page: 1, pageSize: 10 },
        'user-1',
      );

      // Own message: other member last saw at earlier (< now), so seen = false
      expect(result.messages.list[0].seen).toBe(false);
      // Received message: current user last saw at later (>= now), so seen = true
      expect(result.messages.list[1].seen).toBe(true);
    });
  });

  describe('markMessageAsSeen', () => {
    it('should throw if not a member', async () => {
      queryBus.execute.mockResolvedValue({
        id: 'conv-1',
        members: [{ userId: 'user-2' }],
      });
      await expect(
        gateway.markMessageAsSeen(
          {} as any,
          { conversationId: 'conv-1', messageId: 'msg-1' },
          'user-1',
        ),
      ).rejects.toThrow(WsException);
    });

    it('should execute command and broadcast', async () => {
      queryBus.execute.mockResolvedValue({
        id: 'conv-1',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });
      commandBus.execute.mockResolvedValue({});

      await gateway.markMessageAsSeen(
        {} as any,
        { conversationId: 'conv-1', messageId: 'msg-1' },
        'user-1',
      );
      expect(commandBus.execute).toHaveBeenCalled();
      expect(gateway.broadcast).toHaveBeenCalled();
    });
  });
});
