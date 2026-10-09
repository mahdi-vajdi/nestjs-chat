import { Test, TestingModule } from '@nestjs/testing';
import { DeleteMessageHandler } from './delete-message.handler';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { DeleteMessageCommand } from './delete-message.command';
import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';
import {
  ConversationNotFoundException,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '@modules/chat/domain/chat.exceptions';

describe('DeleteMessageHandler', () => {
  let handler: DeleteMessageHandler;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    commandRepo = {
      getConversationById: jest.fn(),
      getMessageById: jest.fn(),
      saveMessageDeletion: jest.fn(),
      saveMessage: jest.fn(),
      updateMessage: jest.fn(),
      saveConversation: jest.fn(),
      deleteConversation: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        return obj;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteMessageHandler,
        { provide: ConversationRepositoryPort, useValue: commandRepo },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<DeleteMessageHandler>(DeleteMessageHandler);
  });

  it('should successfully delete message with ME scope', async () => {
    const convId = 'conv-1';
    const userId = 'user-1';
    const memberId = 'member-1';
    const messageId = 'msg-1';

    const command = new DeleteMessageCommand(
      messageId,
      convId,
      userId,
      MessageDeleteScope.ME,
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: convId,
      members: [{ id: memberId, userId }],
    } as any);

    const messageEntity = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      convId,
    );
    (messageEntity as any).id = messageId;

    commandRepo.getMessageById.mockResolvedValue(messageEntity);
    commandRepo.saveMessageDeletion.mockImplementation(async (msg) => msg);

    const result = await handler.execute(command);

    expect(result.deletedForUserIds).toContain(userId);
    expect(commandRepo.saveMessageDeletion).toHaveBeenCalledWith(messageEntity);
    expect((messageEntity as any).commit).toHaveBeenCalled();
  });

  it('should successfully delete message with EVERYONE scope', async () => {
    const convId = 'conv-1';
    const userId = 'user-1';
    const memberId = 'member-1';
    const messageId = 'msg-1';

    const command = new DeleteMessageCommand(
      messageId,
      convId,
      userId,
      MessageDeleteScope.EVERYONE,
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: convId,
      members: [{ id: memberId, userId }],
    } as any);

    const messageEntity = MessageEntity.create(
      'Initial text',
      MessageType.TEXT,
      memberId,
      convId,
    );
    (messageEntity as any).id = messageId;

    commandRepo.getMessageById.mockResolvedValue(messageEntity);
    commandRepo.saveMessageDeletion.mockImplementation(async (msg) => msg);

    const result = await handler.execute(command);

    expect(result.deletedAt).toBeDefined();
    expect(result.text).toBe('Initial text'); // Retained in DB
    expect(commandRepo.saveMessageDeletion).toHaveBeenCalledWith(messageEntity);
    expect((messageEntity as any).commit).toHaveBeenCalled();
  });

  it('should throw ConversationNotFoundException when conversation does not exist', async () => {
    commandRepo.getConversationById.mockResolvedValue(null);

    const command = new DeleteMessageCommand(
      'msg-1',
      'non-existent-conv',
      'user-1',
      MessageDeleteScope.ME,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      ConversationNotFoundException,
    );
  });

  it('should throw NotMessageOwnerException when user is not a member of conversation', async () => {
    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-2', userId: 'other-user' }],
    } as any);

    const command = new DeleteMessageCommand(
      'msg-1',
      'conv-1',
      'user-1',
      MessageDeleteScope.ME,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      NotMessageOwnerException,
    );
  });

  it('should throw MessageNotFoundException when message does not exist', async () => {
    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'user-1' }],
    } as any);
    commandRepo.getMessageById.mockResolvedValue(null);

    const command = new DeleteMessageCommand(
      'non-existent-msg',
      'conv-1',
      'user-1',
      MessageDeleteScope.ME,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      MessageNotFoundException,
    );
  });

  it('should throw MessageNotFoundException when message belongs to another conversation', async () => {
    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'user-1' }],
    } as any);

    const messageEntity = MessageEntity.create(
      'Text',
      MessageType.TEXT,
      'member-1',
      'other-conv',
    );
    commandRepo.getMessageById.mockResolvedValue(messageEntity);

    const command = new DeleteMessageCommand(
      'msg-1',
      'conv-1',
      'user-1',
      MessageDeleteScope.ME,
    );

    await expect(handler.execute(command)).rejects.toThrow(
      MessageNotFoundException,
    );
  });

  it('should throw NotMessageOwnerException when non-sender deletes for EVERYONE', async () => {
    const convId = 'conv-1';
    const userId = 'user-2';
    const memberId2 = 'member-2';
    const senderMemberId = 'member-1';
    const messageId = 'msg-1';

    const command = new DeleteMessageCommand(
      messageId,
      convId,
      userId,
      MessageDeleteScope.EVERYONE,
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: convId,
      members: [
        { id: senderMemberId, userId: 'user-1' },
        { id: memberId2, userId },
      ],
    } as any);

    const messageEntity = MessageEntity.create(
      'Text',
      MessageType.TEXT,
      senderMemberId,
      convId,
    );
    (messageEntity as any).id = messageId;

    commandRepo.getMessageById.mockResolvedValue(messageEntity);

    await expect(handler.execute(command)).rejects.toThrow(
      NotMessageOwnerException,
    );
  });
});
