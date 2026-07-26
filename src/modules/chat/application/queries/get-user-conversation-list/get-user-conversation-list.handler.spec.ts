import { Test, TestingModule } from '@nestjs/testing';
import { GetUserConversationListHandler } from './get-user-conversation-list.handler';
import { GetUserConversationListQuery } from './get-user-conversation-list.query';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';
import { PaginatedResult } from '@common/pagination/pagination.interface';
import { ConversationReadDto } from '@modules/chat/application/dtos/conversation-read.dto';

describe('GetUserConversationListHandler', () => {
  let handler: GetUserConversationListHandler;
  let queryRepo: jest.Mocked<ConversationReadRepositoryPort>;

  beforeEach(async () => {
    queryRepo = {
      getUserConversationList: jest.fn(),
    } as unknown as jest.Mocked<ConversationReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserConversationListHandler,
        {
          provide: ConversationReadRepositoryPort,
          useValue: queryRepo,
        },
      ],
    }).compile();

    handler = module.get<GetUserConversationListHandler>(
      GetUserConversationListHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return paginated conversation list', async () => {
      const query = new GetUserConversationListQuery('user-1', {
        pagination: { page: 1, pageSize: 10, limit: 10, offset: 0 },
      });
      const expectedResult: PaginatedResult<ConversationReadDto> = {
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

      queryRepo.getUserConversationList.mockResolvedValue(expectedResult);

      const result = await handler.execute(query);

      expect(queryRepo.getUserConversationList).toHaveBeenCalledWith('user-1', {
        pagination: { page: 1, pageSize: 10, limit: 10, offset: 0 },
      });
      expect(result).toEqual(expectedResult);
    });
  });
});
