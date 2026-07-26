import { RefreshTokenEntity } from './refresh-token.entity';

describe('RefreshTokenEntity', () => {
  it('should create correctly', () => {
    const token = RefreshTokenEntity.create('user-1', 'hash', 'jti-1');
    expect(token.id).toBeDefined();
    expect(token.userId).toBe('user-1');
    expect(token.token).toBe('hash');
    expect(token.identifier).toBe('jti-1');
    expect(token.deletedAt).toBeNull();
  });

  it('should throw if missing properties', () => {
    expect(
      () =>
        new RefreshTokenEntity('1', new Date(), new Date(), '', 'token', 'jti'),
    ).toThrow('Refresh token must have a user ID');
    expect(
      () =>
        new RefreshTokenEntity('1', new Date(), new Date(), 'user', '', 'jti'),
    ).toThrow('Refresh token must have a token hash');
    expect(
      () =>
        new RefreshTokenEntity(
          '1',
          new Date(),
          new Date(),
          'user',
          'token',
          '',
        ),
    ).toThrow('Refresh token must have an identifier (JTI)');
  });

  it('should revoke token', () => {
    const token = RefreshTokenEntity.create('user-1', 'hash', 'jti-1');
    token.revoke();
    expect(token.deletedAt).toBeDefined();
    expect(token.deletedAt).not.toBeNull();
  });

  it('should restore token', () => {
    const token = RefreshTokenEntity.create('user-1', 'hash', 'jti-1');
    token.revoke();
    token.restore();
    expect(token.deletedAt).toBeNull();
  });
});
