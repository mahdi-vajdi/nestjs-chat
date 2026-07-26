import { Test, TestingModule } from '@nestjs/testing';
import { UserPostgresReadRepository } from './user-postgres-read.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { User } from '../entities/user.entity';
import { UserBlock } from '../entities/user-block.entity';
import { UserRole } from '@modules/user/domain/enums/user-role.enum';

describe('UserPostgresReadRepository', () => {
  let repository: UserPostgresReadRepository;
  let queryBuilderMock: any;
  let userRepoMock: any;
  let userBlockRepoMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getExists: jest.fn(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    };

    userRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    userBlockRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPostgresReadRepository,
        {
          provide: getRepositoryToken(User, DatabaseType.POSTGRES),
          useValue: userRepoMock,
        },
        {
          provide: getRepositoryToken(UserBlock, DatabaseType.POSTGRES),
          useValue: userBlockRepoMock,
        },
      ],
    }).compile();

    repository = module.get<UserPostgresReadRepository>(
      UserPostgresReadRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getUserByEmail', () => {
    it('should return null if user not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserByEmail('test@test.com');
      expect(result).toBeNull();
    });

    it('should return mapped dto if found', async () => {
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        role: UserRole.USER,
      });
      const result = await repository.getUserByEmail('test@test.com');
      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
    });
  });

  describe('getUserById', () => {
    it('should return null if user not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserById('user-1');
      expect(result).toBeNull();
    });

    it('should return mapped dto if found', async () => {
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'user-1',
        role: UserRole.USER,
      });
      const result = await repository.getUserById('user-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
    });
  });

  describe('getUserByUsername', () => {
    it('should return null if user not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getUserByUsername('username');
      expect(result).toBeNull();
    });
  });

  describe('getUserIdsByNameOrUsername', () => {
    it('should return array of ids', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([
        { id: 'user-1' },
        { id: 'user-2' },
      ]);
      const result = await repository.getUserIdsByNameOrUsername('name');
      expect(result).toEqual(['user-1', 'user-2']);
    });
  });

  describe('getUsersByIds', () => {
    it('should return empty array if no ids provided', async () => {
      const result = await repository.getUsersByIds([]);
      expect(result).toEqual([]);
    });

    it('should return mapped dtos', async () => {
      queryBuilderMock.getMany.mockResolvedValue([
        { id: 'user-1', role: UserRole.USER },
      ]);
      const result = await repository.getUsersByIds(['user-1']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
    });
  });

  describe('getBlockStatus', () => {
    it('should return boolean', async () => {
      queryBuilderMock.getExists.mockResolvedValue(true);
      const result = await repository.getBlockStatus('user-1', 'user-2');
      expect(result).toBe(true);
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return array of ids without blockedIds filter', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ blockedId: 'user-2' }]);
      const result = await repository.getBlockedUserIds('user-1');
      expect(result).toEqual(['user-2']);
    });

    it('should return array of ids with blockedIds filter', async () => {
      queryBuilderMock.getRawMany.mockResolvedValue([{ blockedId: 'user-2' }]);
      const result = await repository.getBlockedUserIds('user-1', ['user-2']);
      expect(result).toEqual(['user-2']);
    });
  });
});
