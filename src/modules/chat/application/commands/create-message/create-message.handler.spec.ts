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
});
