import { Test, TestingModule } from '@nestjs/testing';
import { ConversationPostgresRepository } from './conversation-postgres.repository';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { Conversation } from '../entities/conversation.entity';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';
import { ConversationType } from '@modules/chat/domain/enums/conversation-type.enum';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';

describe('ConversationPostgresRepository', () => {
  let repository: ConversationPostgresRepository;
  let dataSourceMock: any;
  let queryBuilderMock: any;
  let entityManagerMock: any;
  let repoMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      softDelete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    repoMock = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    entityManagerMock = {
      save: jest.fn(),
      getRepository: jest.fn().mockReturnValue(repoMock),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      findOne: jest.fn(),
    };

    dataSourceMock = {
      getRepository: jest.fn().mockReturnValue(repoMock),
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(entityManagerMock);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationPostgresRepository,
        {
          provide: getDataSourceToken(DatabaseType.POSTGRES),
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    repository = module.get<ConversationPostgresRepository>(
      ConversationPostgresRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getConversationById', () => {
    it('should return null if not found', async () => {
      repoMock.findOne.mockResolvedValue(null);
      const result = await repository.getConversationById('conv-1');
      expect(result).toBeNull();
    });

    it('should return domain entity if found', async () => {
      const conv = new Conversation();
      conv.id = 'conv-1';
      conv.type = ConversationType.DIRECT;
      conv.created_at = new Date();
      conv.updated_at = new Date();
      conv.conversationMembers = [];

      repoMock.findOne.mockResolvedValue(conv);

      const result = await repository.getConversationById('conv-1');
      expect(result).toBeInstanceOf(ConversationEntity);
      expect(result?.id).toBe('conv-1');
    });
  });

  describe('saveConversation', () => {
    it('should save and return conversation', async () => {
      const conv = ConversationEntity.createDirect('user-1', 'user-2');
      entityManagerMock.save.mockImplementation(async (entity) => entity);
      entityManagerMock.findOne.mockResolvedValue(
        Conversation.fromDomain(conv),
      );

      const result = await repository.saveConversation(conv);

      expect(entityManagerMock.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ConversationEntity);
      expect(result.id).toBe(conv.id);
    });
  });

  describe('saveMessage', () => {
    it('should save message and update members', async () => {
      const msg = MessageEntity.create(
        'hello',
        MessageType.TEXT,
        'user-1',
        'conv-1',
        ['user-2'],
      );
      entityManagerMock.save.mockImplementation(async (entity) => entity);
      queryBuilderMock.getMany.mockResolvedValue([
        { user_id: 'user-1' },
        { user_id: 'user-2' },
      ]);

      const result = await repository.saveMessage(msg);

      expect(entityManagerMock.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(MessageEntity);
      expect(result.id).toBe(msg.id);
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation and return true', async () => {
      queryBuilderMock.execute.mockResolvedValue({ affected: 1 });
      const result = await repository.deleteConversation('conv-1');
      expect(result).toBe(true);
    });
  });
});
