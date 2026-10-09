import { Test, TestingModule } from '@nestjs/testing';
import { CreateMessageHandler } from './create-message.handler';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { CreateMessageCommand } from './create-message.command';
import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';

describe('CreateMessageHandler', () => {
  let handler: CreateMessageHandler;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    commandRepo = {
      saveConversation: jest.fn(),
      saveMessage: jest.fn(),
      findConversationByMembers: jest.fn(),
      getConversationById: jest.fn(),
      getMessageById: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        return obj;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateMessageHandler,
        { provide: ConversationRepositoryPort, useValue: commandRepo },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<CreateMessageHandler>(CreateMessageHandler);
  });

  it('should successfully create and save a message', async () => {
    const command = new CreateMessageCommand(
      'Hello!',
      MessageType.TEXT,
      'sender-1',
      'conv-1',
      [],
    );

    commandRepo.saveMessage.mockImplementation(async (msg) => msg);
    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'sender-1' }],
    } as any);

    const result = await handler.execute(command);

    expect(result).toBeInstanceOf(MessageEntity);
    expect(result.text).toBe('Hello!');
    expect(result.senderId).toBe('member-1');
    expect(result.conversationId).toBe('conv-1');
    expect(commandRepo.saveMessage).toHaveBeenCalledWith(result);
    expect(publisher.mergeObjectContext).toHaveBeenCalledWith(result);
    expect((result as any).commit).toHaveBeenCalled();
  });

  it('should successfully create and save a reply message', async () => {
    const command = new CreateMessageCommand(
      'Replying to hello',
      MessageType.TEXT,
      'sender-1',
      'conv-1',
      [],
      'parent-msg-1',
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'sender-1' }],
    } as any);
    commandRepo.getMessageById.mockResolvedValue({
      id: 'parent-msg-1',
      conversationId: 'conv-1',
      deletedAt: null,
      deletedForUserIds: [],
    } as any);
    commandRepo.saveMessage.mockImplementation(async (msg) => msg);

    const result = await handler.execute(command);

    expect(result).toBeInstanceOf(MessageEntity);
    expect(result.text).toBe('Replying to hello');
    expect(result.replyToMessageId).toBe('parent-msg-1');
    expect(commandRepo.saveMessage).toHaveBeenCalled();
  });

  it('should throw MessageNotFoundException when replied message does not exist', async () => {
    const command = new CreateMessageCommand(
      'Replying to ghost',
      MessageType.TEXT,
      'sender-1',
      'conv-1',
      [],
      'ghost-msg',
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'sender-1' }],
    } as any);
    commandRepo.getMessageById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(
      'Replied message not found',
    );
  });

  it('should throw ChatDomainError when replied message is from another conversation', async () => {
    const command = new CreateMessageCommand(
      'Cross conversation reply',
      MessageType.TEXT,
      'sender-1',
      'conv-1',
      [],
      'parent-other-conv',
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'sender-1' }],
    } as any);
    commandRepo.getMessageById.mockResolvedValue({
      id: 'parent-other-conv',
      conversationId: 'other-conv-999',
      deletedAt: null,
      deletedForUserIds: [],
    } as any);

    await expect(handler.execute(command)).rejects.toThrow(
      'Replied message does not belong to this conversation',
    );
  });

  it('should throw ChatDomainError when replied message is deleted for everyone', async () => {
    const command = new CreateMessageCommand(
      'Reply to deleted',
      MessageType.TEXT,
      'sender-1',
      'conv-1',
      [],
      'deleted-parent',
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'sender-1' }],
    } as any);
    commandRepo.getMessageById.mockResolvedValue({
      id: 'deleted-parent',
      conversationId: 'conv-1',
      deletedAt: new Date(),
      deletedForUserIds: [],
    } as any);

    await expect(handler.execute(command)).rejects.toThrow(
      'Cannot reply to a deleted message',
    );
  });

  it('should throw MessageNotFoundException when replied message was deleted for the sender', async () => {
    const command = new CreateMessageCommand(
      'Reply to self-deleted',
      MessageType.TEXT,
      'sender-1',
      'conv-1',
      [],
      'parent-deleted-for-me',
    );

    commandRepo.getConversationById.mockResolvedValue({
      id: 'conv-1',
      members: [{ id: 'member-1', userId: 'sender-1' }],
    } as any);
    commandRepo.getMessageById.mockResolvedValue({
      id: 'parent-deleted-for-me',
      conversationId: 'conv-1',
      deletedAt: null,
      deletedForUserIds: ['sender-1'],
    } as any);

    await expect(handler.execute(command)).rejects.toThrow(
      'Replied message not found',
    );
  });
});
