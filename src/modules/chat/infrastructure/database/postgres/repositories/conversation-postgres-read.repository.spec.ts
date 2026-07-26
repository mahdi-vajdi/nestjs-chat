import { Test, TestingModule } from '@nestjs/testing';
import { ConversationPostgresReadRepository } from './conversation-postgres-read.repository';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { ConversationType } from '@modules/chat/domain/enums/conversation-type.enum';

describe('ConversationPostgresReadRepository', () => {
  let repository: ConversationPostgresReadRepository;
  let dataSourceMock: any;
  let queryBuilderMock: any;
  let conversationRepoMock: any;
  let messageRepoMock: any;
  let conversationMemberRepoMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      andWhereExists: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getQuery: jest.fn().mockReturnValue(''),
      getExists: jest.fn(),
      getManyAndCount: jest.fn(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    };

    conversationRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    messageRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    conversationMemberRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const entityManager = {
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Message) return messageRepoMock;
            return {
              createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
            };
          }),
        };
        return cb(entityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationPostgresReadRepository,
        {
          provide: getRepositoryToken(Conversation, DatabaseType.POSTGRES),
          useValue: conversationRepoMock,
        },
        {
          provide: getRepositoryToken(Message, DatabaseType.POSTGRES),
          useValue: messageRepoMock,
        },
        {
          provide: getRepositoryToken(
            ConversationMember,
            DatabaseType.POSTGRES,
          ),
          useValue: conversationMemberRepoMock,
        },
        {
          provide: getDataSourceToken(DatabaseType.POSTGRES),
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    repository = module.get<ConversationPostgresReadRepository>(
      ConversationPostgresReadRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('conversationExists', () => {
    it('should return boolean', async () => {
      queryBuilderMock.getExists.mockResolvedValue(true);
      const result = await repository.conversationExists('user-1', 'user-2');
      expect(result).toBe(true);
    });
  });

  describe('getUserConversationList', () => {
    it('should return empty paginated result if no conversations', async () => {
      queryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);
      const result = await repository.getUserConversationList('user-1', {
        pagination: { page: 1, pageSize: 10, limit: 10, offset: 0 },
      });
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should return mapped conversations', async () => {
      const convDate = new Date();
      queryBuilderMock.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'conv-1',
            type: ConversationType.DIRECT,
            created_at: convDate,
            updated_at: convDate,
            conversationMembers: [{ user_id: 'user-1' }],
          },
        ],
        1,
      ]);
      queryBuilderMock.getRawMany.mockResolvedValue([
        { conversationId: 'conv-1', notSeenCount: '1' },
      ]);
      queryBuilderMock.getMany.mockResolvedValue([
        { conversation_id: 'conv-1', user_id: 'user-2' },
      ]);

      const result = await repository.getUserConversationList('user-1', {
        pagination: { page: 1, pageSize: 10, limit: 10, offset: 0 },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('conv-1');
      expect(result.data[0].notSeenCount).toBe(1);
    });
  });

  describe('getUserConversationIds', () => {
    it('should return array of ids', async () => {
      queryBuilderMock.getMany.mockResolvedValue([{ id: 'conv-1' }]);
      const result = await repository.getUserConversationIds('user-1', {});
      expect(result).toEqual(['conv-1']);
    });
  });

  describe('getUserConversationById', () => {
    it('should return null if not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserConversationById(
        'conv-1',
        'user-1',
      );
      expect(result).toBeNull();
    });

    it('should return dto if found', async () => {
      const convDate = new Date();
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'conv-1',
        type: ConversationType.DIRECT,
        created_at: convDate,
        updated_at: convDate,
        conversationMembers: [{ id: 'cm-1', user_id: 'user-1' }],
      });

      const result = await repository.getUserConversationById(
        'conv-1',
        'user-1',
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe('conv-1');
    });
  });

  describe('getUserConversationMessageList', () => {
    it('should return paginated messages', async () => {
      const msgDate = new Date();
      queryBuilderMock.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'msg-1',
            text: 'hello',
            sender_id: 'user-1',
            created_at: msgDate,
          },
        ],
        1,
      ]);

      const result = await repository.getUserConversationMessageList(
        'conv-1',
        'user-1',
        {
          page: 1,
          pageSize: 10,
          limit: 10,
          offset: 0,
        },
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
