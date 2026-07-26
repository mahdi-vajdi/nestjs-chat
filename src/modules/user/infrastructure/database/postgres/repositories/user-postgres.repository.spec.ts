import { Test, TestingModule } from '@nestjs/testing';
import { UserPostgresRepository } from './user-postgres.repository';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserBlock } from '../entities/user-block.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';

describe('UserPostgresRepository', () => {
  let repository: UserPostgresRepository;
  let userRepositoryMock: any;
  let userBlockRepositoryMock: any;
  let dataSourceMock: any;
  let queryBuilderMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
      getExists: jest.fn(),
      softDelete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    userRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      save: jest.fn(),
      delete: jest.fn(),
    };

    userBlockRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      insert: jest.fn(),
    };

    dataSourceMock = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const entityManager = {
          getRepository: jest.fn().mockReturnValue(userBlockRepositoryMock),
        };
        return cb(entityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPostgresRepository,
        {
          provide: getRepositoryToken(User, DatabaseType.POSTGRES),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(UserBlock, DatabaseType.POSTGRES),
          useValue: userBlockRepositoryMock,
        },
        {
          provide: getDataSourceToken(DatabaseType.POSTGRES),
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    repository = module.get<UserPostgresRepository>(UserPostgresRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return null if user not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserById('id-1');
      expect(result).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return null if user not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserByEmail('test@test.com');
      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return null if user not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserByUsername('test');
      expect(result).toBeNull();
    });
  });

  describe('userExists', () => {
    it('should return true if user exists', async () => {
      queryBuilderMock.getExists.mockResolvedValue(true);
      const result = await repository.userExists({ email: 'test@test.com' });
      expect(result).toBe(true);
    });
  });

  describe('getUserIdsByNameOrUsername', () => {
    it('should return array of ids', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ id: 'id-1' }]);
      const result = await repository.getUserIdsByNameOrUsername('test');
      expect(result).toEqual(['id-1']);
    });
  });

  describe('getUsersByIds', () => {
    it('should return empty array if no users found', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      const result = await repository.getUsersByIds(['id-1']);
      expect(result).toEqual([]);
    });
  });

  describe('block', () => {
    it('should return false if already blocked', async () => {
      queryBuilderMock.getExists.mockResolvedValue(true);
      const result = await repository.block('blocker', 'blocked');
      expect(result).toBe(false);
    });

    it('should insert block and return true if not blocked', async () => {
      queryBuilderMock.getExists.mockResolvedValue(false);
      const result = await repository.block('blocker', 'blocked');
      expect(userBlockRepositoryMock.insert).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('unblock', () => {
    it('should execute soft delete and return true if affected', async () => {
      queryBuilderMock.execute.mockResolvedValue({ affected: 1 });
      const result = await repository.unblock('blocker', 'blocked');
      expect(result).toBe(true);
    });
  });

  describe('getBlockStatus', () => {
    it('should return true if blocked', async () => {
      queryBuilderMock.getExists.mockResolvedValue(true);
      const result = await repository.getBlockStatus('blocker', 'blocked');
      expect(result).toBe(true);
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return array of blocked ids', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([
        { blockedId: 'blocked-1' },
      ]);
      const result = await repository.getBlockedUserIds('blocker', [
        'blocked-1',
      ]);
      expect(result).toEqual(['blocked-1']);
    });
  });

  describe('delete', () => {
    it('should return true if affected', async () => {
      userRepositoryMock.delete.mockResolvedValue({ affected: 1 });
      const result = await repository.delete('id-1');
      expect(result).toBe(true);
    });
  });
});
