import { Test, TestingModule } from '@nestjs/testing';
import { MarkConversationAsReadCommandHandler } from './mark-conversation-as-read.handler';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { EventPublisher } from '@nestjs/cqrs';
import { MarkConversationAsReadCommand } from './mark-conversation-as-read.command';
import { ConversationNotFoundException } from '@modules/chat/domain/chat.exceptions';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';

describe('MarkConversationAsReadCommandHandler', () => {
  let handler: MarkConversationAsReadCommandHandler;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    commandRepo = {
      getConversationById: jest.fn(),
      saveConversation: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        return obj;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkConversationAsReadCommandHandler,
        { provide: ConversationRepositoryPort, useValue: commandRepo },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<MarkConversationAsReadCommandHandler>(
      MarkConversationAsReadCommandHandler,
    );
  });

  it('should throw ConversationNotFoundException if conversation does not exist', async () => {
    commandRepo.getConversationById.mockResolvedValue(null);
    const command = new MarkConversationAsReadCommand(
      'conv-1',
      'user-1',
      'msg-1',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      ConversationNotFoundException,
    );
  });

  it('should successfully mark conversation as read', async () => {
    const conversation = ConversationEntity.createDirect('user-1', 'user-2');
    conversation.markAsRead = jest.fn();

    commandRepo.getConversationById.mockResolvedValue(conversation);
    commandRepo.saveConversation.mockImplementation(async (conv) => conv);

    const command = new MarkConversationAsReadCommand(
      conversation.id,
      'user-1',
      'msg-1',
    );
    await handler.execute(command);

    expect(conversation.markAsRead).toHaveBeenCalledWith('user-1', 'msg-1');
    expect(commandRepo.saveConversation).toHaveBeenCalledWith(conversation);
    expect(publisher.mergeObjectContext).toHaveBeenCalledWith(conversation);
    expect((conversation as any).commit).toHaveBeenCalled();
  });
});
