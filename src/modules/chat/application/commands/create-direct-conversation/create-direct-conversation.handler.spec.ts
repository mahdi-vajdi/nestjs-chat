import { Test, TestingModule } from '@nestjs/testing';
import { CreateDirectConversationHandler } from './create-direct-conversation.handler';
import { ConversationRepositoryPort } from '@modules/chat/application/ports/conversation-repository.port';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import { EventPublisher } from '@nestjs/cqrs';
import { CreateDirectConversationCommand } from './create-direct-conversation.command';
import {
  BlockedUserException,
  ConversationAlreadyExistsException,
  TargetUserNotFoundException,
} from '@modules/chat/domain/chat.exceptions';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';

describe('CreateDirectConversationHandler', () => {
  let handler: CreateDirectConversationHandler;
  let commandRepo: jest.Mocked<ConversationRepositoryPort>;
  let queryRepo: jest.Mocked<ConversationReadRepositoryPort>;
  let userIntegrationPort: jest.Mocked<UserIntegrationPort>;
  let publisher: jest.Mocked<EventPublisher>;

  beforeEach(async () => {
    commandRepo = {
      saveConversation: jest.fn(),
      saveMessage: jest.fn(),
      findConversationByMembers: jest.fn(),
    } as any;

    queryRepo = {
      conversationExists: jest.fn(),
      getUserConversationIds: jest.fn(),
      getConversation: jest.fn(),
      getUserConversationList: jest.fn(),
      getConversationMessageList: jest.fn(),
    } as any;

    userIntegrationPort = {
      doesUserExist: jest.fn(),
      hasBlockRelation: jest.fn(),
      getBlockedUserIds: jest.fn(),
      getUsersByIds: jest.fn(),
      searchUserIdsByNameOrUsername: jest.fn(),
    } as any;

    publisher = {
      mergeObjectContext: jest.fn().mockImplementation((obj) => {
        obj.commit = jest.fn();
        return obj;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDirectConversationHandler,
        { provide: ConversationRepositoryPort, useValue: commandRepo },
        { provide: ConversationReadRepositoryPort, useValue: queryRepo },
        { provide: UserIntegrationPort, useValue: userIntegrationPort },
        { provide: EventPublisher, useValue: publisher },
      ],
    }).compile();

    handler = module.get<CreateDirectConversationHandler>(
      CreateDirectConversationHandler,
    );
  });

  it('should throw TargetUserNotFoundException if target user does not exist', async () => {
    userIntegrationPort.doesUserExist.mockResolvedValue(false);
    const command = new CreateDirectConversationCommand('user-1', 'user-2');

    await expect(handler.execute(command)).rejects.toThrow(
      TargetUserNotFoundException,
    );
  });

  it('should throw BlockedUserException if there is a block relation', async () => {
    userIntegrationPort.doesUserExist.mockResolvedValue(true);
    userIntegrationPort.hasBlockRelation.mockResolvedValue(true);
    const command = new CreateDirectConversationCommand('user-1', 'user-2');

    await expect(handler.execute(command)).rejects.toThrow(
      BlockedUserException,
    );
  });

  it('should throw ConversationAlreadyExistsException if conversation already exists', async () => {
    userIntegrationPort.doesUserExist.mockResolvedValue(true);
    userIntegrationPort.hasBlockRelation.mockResolvedValue(false);
    queryRepo.conversationExists.mockResolvedValue(true);
    const command = new CreateDirectConversationCommand('user-1', 'user-2');

    await expect(handler.execute(command)).rejects.toThrow(
      ConversationAlreadyExistsException,
    );
  });

  it('should successfully create a direct conversation', async () => {
    userIntegrationPort.doesUserExist.mockResolvedValue(true);
    userIntegrationPort.hasBlockRelation.mockResolvedValue(false);
    queryRepo.conversationExists.mockResolvedValue(false);

    commandRepo.saveConversation.mockImplementation(async (conv) => conv);

    const command = new CreateDirectConversationCommand('user-1', 'user-2');
    const result = await handler.execute(command);

    expect(result).toBeInstanceOf(ConversationEntity);
    expect(commandRepo.saveConversation).toHaveBeenCalledWith(result);
    expect(publisher.mergeObjectContext).toHaveBeenCalledWith(result);
    expect((result as any).commit).toHaveBeenCalled();
  });
});
