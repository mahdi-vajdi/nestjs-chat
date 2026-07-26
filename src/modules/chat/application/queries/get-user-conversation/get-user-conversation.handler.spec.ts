import { Test, TestingModule } from '@nestjs/testing';
import { GetUserConversationHandler } from './get-user-conversation.handler';
import { GetUserConversationQuery } from './get-user-conversation.query';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { ConversationNotFoundException } from '@modules/chat/domain/chat.exceptions';
import { ConversationReadDto } from '@modules/chat/application/dtos/conversation-read.dto';
import { ConversationType } from '@modules/chat/domain/enums/conversation-type.enum';

describe('GetUserConversationHandler', () => {
  let handler: GetUserConversationHandler;
  let queryRepo: jest.Mocked<ConversationReadRepositoryPort>;

  beforeEach(async () => {
    queryRepo = {
      getUserConversationById: jest.fn(),
    } as unknown as jest.Mocked<ConversationReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserConversationHandler,
        {
          provide: ConversationReadRepositoryPort,
          useValue: queryRepo,
        },
      ],
    }).compile();

    handler = module.get<GetUserConversationHandler>(
      GetUserConversationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return the conversation if found', async () => {
      const query = new GetUserConversationQuery('conv-1', 'user-1');
      const expectedConv: ConversationReadDto = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        identifier: 'identifier',
        title: 'title',
        picture: 'picture',
        notSeenCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: null,
        members: [],
      };

      queryRepo.getUserConversationById.mockResolvedValue(expectedConv);

      const result = await handler.execute(query);

      expect(queryRepo.getUserConversationById).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
      );
      expect(result).toEqual(expectedConv);
    });

    it('should throw ConversationNotFoundException if not found', async () => {
      const query = new GetUserConversationQuery('conv-1', 'user-1');
      queryRepo.getUserConversationById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(
        ConversationNotFoundException,
      );
    });
  });
});
