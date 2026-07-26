import { Test, TestingModule } from '@nestjs/testing';
import { GetUserConversationMessageListHandler } from './get-user-conversation-message-list.handler';
import { GetUserConversationMessageListQuery } from './get-user-conversation-message-list.query';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { PaginatedResult } from '@common/pagination/pagination.interface';
import { MessageReadDto } from '@modules/chat/application/dtos/message-read.dto';

describe('GetUserConversationMessageListHandler', () => {
  let handler: GetUserConversationMessageListHandler;
  let queryRepo: jest.Mocked<ConversationReadRepositoryPort>;

  beforeEach(async () => {
    queryRepo = {
      getUserConversationMessageList: jest.fn(),
    } as unknown as jest.Mocked<ConversationReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserConversationMessageListHandler,
        {
          provide: ConversationReadRepositoryPort,
          useValue: queryRepo,
        },
      ],
    }).compile();

    handler = module.get<GetUserConversationMessageListHandler>(
      GetUserConversationMessageListHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated message list', async () => {
      const query = new GetUserConversationMessageListQuery(
        'conv-1',
        'user-1',
        { page: 1, pageSize: 10, limit: 10, offset: 0 },
      );
      const expectedResult: PaginatedResult<MessageReadDto> = {
        data: [],
        meta: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };

      queryRepo.getUserConversationMessageList.mockResolvedValue(
        expectedResult,
      );

      const result = await handler.execute(query);

      expect(queryRepo.getUserConversationMessageList).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
        { page: 1, pageSize: 10, limit: 10, offset: 0 },
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
