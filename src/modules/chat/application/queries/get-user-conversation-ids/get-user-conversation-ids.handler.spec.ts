import { Test, TestingModule } from '@nestjs/testing';
import { GetUserConversationIdsHandler } from './get-user-conversation-ids.handler';
import { GetUserConversationIdsQuery } from './get-user-conversation-ids.query';
import { ConversationReadRepositoryPort } from '@modules/chat/application/ports/conversation-read-repository.port';

describe('GetUserConversationIdsHandler', () => {
  let handler: GetUserConversationIdsHandler;
  let queryRepo: jest.Mocked<ConversationReadRepositoryPort>;

  beforeEach(async () => {
    queryRepo = {
      getUserConversationIds: jest.fn(),
    } as unknown as jest.Mocked<ConversationReadRepositoryPort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserConversationIdsHandler,
        {
          provide: ConversationReadRepositoryPort,
          useValue: queryRepo,
        },
      ],
    }).compile();

    handler = module.get<GetUserConversationIdsHandler>(
      GetUserConversationIdsHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return conversation ids for a user', async () => {
      const query = new GetUserConversationIdsQuery('user-1', {});
      const expectedIds = ['conv-1', 'conv-2'];

      queryRepo.getUserConversationIds.mockResolvedValue(expectedIds);

      const result = await handler.execute(query);

      expect(queryRepo.getUserConversationIds).toHaveBeenCalledWith(
        'user-1',
        {},
      );
      expect(result).toEqual(expectedIds);
    });
  });
});
