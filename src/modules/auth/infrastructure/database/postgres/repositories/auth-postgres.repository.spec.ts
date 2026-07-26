import { Test, TestingModule } from '@nestjs/testing';
import { AuthPostgresRepository } from './auth-postgres.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenEntity } from '@modules/auth/domain/models/refresh-token.entity';

describe('AuthPostgresRepository', () => {
  let repository: AuthPostgresRepository;
  let queryBuilderMock: any;
  let repoMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    repoMock = {
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthPostgresRepository,
        {
          provide: getRepositoryToken(RefreshToken, DatabaseType.POSTGRES),
          useValue: repoMock,
        },
      ],
    }).compile();

    repository = module.get<AuthPostgresRepository>(AuthPostgresRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should save and return entity', async () => {
      const entity = RefreshTokenEntity.create(
        'user-1',
        'hash',
        new Date().toISOString(),
      );
      repoMock.save.mockResolvedValue(RefreshToken.fromDomain(entity));

      const result = await repository.save(entity);

      expect(repoMock.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(RefreshTokenEntity);
      expect(result.identifier).toBe(entity.identifier);
    });
  });

  describe('getRefreshToken', () => {
    it('should return null if not found', async () => {
      queryBuilderMock.getOne.mockResolvedValue(null);
      const result = await repository.getRefreshToken('id-1', 'user-1');
      expect(result).toBeNull();
    });

    it('should return entity if found', async () => {
      const entity = RefreshTokenEntity.create(
        'user-1',
        'hash',
        new Date().toISOString(),
      );
      queryBuilderMock.getOne.mockResolvedValue(
        RefreshToken.fromDomain(entity),
      );

      const result = await repository.getRefreshToken(
        entity.identifier,
        'user-1',
      );
      expect(result).toBeInstanceOf(RefreshTokenEntity);
      expect(result?.identifier).toBe(entity.identifier);
    });
  });
});
