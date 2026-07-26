import { Test, TestingModule } from '@nestjs/testing';
import { UserIntegrationAdapter } from './user-integration.adapter';
import { QueryBus } from '@nestjs/cqrs';
import { GetUserByIdQuery } from '@modules/user/application/queries/get-user-by-id/get-user-by-id.query';
import { GetBlockStatusQuery } from '@modules/user/application/queries/get-block-status/get-block-status.query';
import { GetUsersByIdsQuery } from '@modules/user/application/queries/get-users-by-ids/get-users-by-ids.query';
import { GetUserIdsByNameOrUsernameQuery } from '@modules/user/application/queries/get-user-ids-by-name-or-username/get-user-ids-by-name-or-username.query';
import { GetBlockedUsersIdsQuery } from '@modules/user/application/queries/get-blocked-users-ids/get-blocked-users-ids.query';
import { UserNotFoundException } from '@modules/user/domain/user.exceptions';

describe('UserIntegrationAdapter', () => {
  let adapter: UserIntegrationAdapter;
  let queryBusMock: any;

  beforeEach(async () => {
    queryBusMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserIntegrationAdapter,
        { provide: QueryBus, useValue: queryBusMock },
      ],
    }).compile();

    adapter = module.get<UserIntegrationAdapter>(UserIntegrationAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('doesUserExist', () => {
    it('should return true if user exists', async () => {
      queryBusMock.execute.mockResolvedValue({});
      const result = await adapter.doesUserExist('user-1');
      expect(result).toBe(true);
      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new GetUserByIdQuery('user-1'),
      );
    });

    it('should return false if UserNotFoundException is thrown', async () => {
      queryBusMock.execute.mockRejectedValue(
        new UserNotFoundException('user-1'),
      );
      const result = await adapter.doesUserExist('user-1');
      expect(result).toBe(false);
    });

    it('should throw if other error occurs', async () => {
      queryBusMock.execute.mockRejectedValue(new Error('Other error'));
      await expect(adapter.doesUserExist('user-1')).rejects.toThrow(
        'Other error',
      );
    });
  });

  describe('hasBlockRelation', () => {
    it('should return true if blocked', async () => {
      queryBusMock.execute.mockResolvedValue({
        isBlocked: true,
        isBlocker: false,
      });
      const result = await adapter.hasBlockRelation('user-1', 'user-2');
      expect(result).toBe(true);
      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new GetBlockStatusQuery('user-1', 'user-2'),
      );
    });

    it('should return true if blocker', async () => {
      queryBusMock.execute.mockResolvedValue({
        isBlocked: false,
        isBlocker: true,
      });
      const result = await adapter.hasBlockRelation('user-1', 'user-2');
      expect(result).toBe(true);
    });

    it('should return false if neither', async () => {
      queryBusMock.execute.mockResolvedValue({
        isBlocked: false,
        isBlocker: false,
      });
      const result = await adapter.hasBlockRelation('user-1', 'user-2');
      expect(result).toBe(false);
    });
  });

  describe('getUserById', () => {
    it('should return ChatUser', async () => {
      queryBusMock.execute.mockResolvedValue({
        id: 'user-1',
        username: 'test',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
      });
      const result = await adapter.getUserById('user-1');
      expect(result.id).toBe('user-1');
      expect(result.username).toBe('test');
    });
  });

  describe('getUsersByIds', () => {
    it('should return array of ChatUsers', async () => {
      queryBusMock.execute.mockResolvedValue([
        {
          id: 'user-1',
          username: 'test',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
        },
      ]);
      const result = await adapter.getUsersByIds(['user-1']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-1');
      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new GetUsersByIdsQuery(['user-1']),
      );
    });
  });

  describe('getUserIdsByNameOrUsername', () => {
    it('should return array of ids', async () => {
      queryBusMock.execute.mockResolvedValue(['user-1']);
      const result = await adapter.getUserIdsByNameOrUsername('test');
      expect(result).toEqual(['user-1']);
      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new GetUserIdsByNameOrUsernameQuery('test'),
      );
    });
  });

  describe('getBlockedUsersIds', () => {
    it('should return array of blocked ids', async () => {
      queryBusMock.execute.mockResolvedValue(['user-2']);
      const result = await adapter.getBlockedUsersIds('user-1', ['user-2']);
      expect(result).toEqual(['user-2']);
      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new GetBlockedUsersIdsQuery('user-1', ['user-2']),
      );
    });
  });

  describe('getBlockStatus', () => {
    it('should return block status', async () => {
      queryBusMock.execute.mockResolvedValue({
        isBlocked: true,
        isBlocker: false,
      });
      const result = await adapter.getBlockStatus('user-1', 'user-2');
      expect(result).toEqual({ isBlocked: true, isBlocker: false });
      expect(queryBusMock.execute).toHaveBeenCalledWith(
        new GetBlockStatusQuery('user-1', 'user-2'),
      );
    });
  });
});
