import { Test, TestingModule } from '@nestjs/testing';
import { EditMessageHandler } from './edit-message.handler';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { EditMessageCommand } from './edit-message.command';
import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import {
  ConversationNotFoundException,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '@modules/chat/domain/chat.exceptions';

describe('EditMessageHandler', () => {
  let handler: EditMessageHandler;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    commandRepo = {
      getConversationById: jest.fn(),
      getMessageById: jest.fn(),
      updateMessage: jest.fn(),
      saveMessage: jest.fn(),
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
        EditMessageHandler,
        { provide: ConversationRepositoryPort, useValue: commandRepo },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<EditMessageHandler>(EditMessageHandler);
  });

  it('should successfully edit and update a message', async () => {
    const convId = 'conv-1';
    const userId = 'user-1';
    const memberId = 'member-1';
    const messageId = 'msg-1';

    const command = new EditMessageCommand(
      messageId,
      convId,
      userId,
      'Updated text',
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
    // ensure ID matches
    (messageEntity as any).id = messageId;

    commandRepo.getMessageById.mockResolvedValue(messageEntity);
    commandRepo.updateMessage.mockImplementation(async (msg) => msg);

    const result = await handler.execute(command);

    expect(result.text).toBe('Updated text');
    expect(result.editedAt).toBeDefined();
    expect(commandRepo.updateMessage).toHaveBeenCalledWith(messageEntity);
    expect(commandRepo.saveMessage).not.toHaveBeenCalled();
    expect((messageEntity as any).commit).toHaveBeenCalled();
  });

  it('should throw ConversationNotFoundException when conversation does not exist', async () => {
    commandRepo.getConversationById.mockResolvedValue(null);

    const command = new EditMessageCommand(
      'msg-1',
      'non-existent-conv',
      'user-1',
      'text',
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

    const command = new EditMessageCommand('msg-1', 'conv-1', 'user-1', 'text');

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

    const command = new EditMessageCommand(
      'non-existent-msg',
      'conv-1',
      'user-1',
      'text',
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

    const command = new EditMessageCommand('msg-1', 'conv-1', 'user-1', 'text');

    await expect(handler.execute(command)).rejects.toThrow(
      MessageNotFoundException,
    );
  });
});
