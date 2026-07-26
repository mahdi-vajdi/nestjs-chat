import {
  AuthDomainError,
  InvalidRefreshTokenException,
  TokenGenerationException,
} from './auth.exceptions';

describe('AuthExceptions', () => {
  it('should instantiate AuthDomainError correctly', () => {
    const ex = new AuthDomainError('message');
    expect(ex.message).toBe('message');
    expect(ex.code).toBe('AUTH_DOMAIN_ERROR');
    expect(ex.type).toBe('BUSINESS_RULE');
  });

  it('should instantiate InvalidRefreshTokenException correctly', () => {
    const ex = new InvalidRefreshTokenException();
    expect(ex.message).toBe('Refresh token is invalid or expired');
    expect(ex.code).toBe('AUTH_INVALID_REFRESH_TOKEN');
  });

  it('should instantiate TokenGenerationException correctly', () => {
    const ex = new TokenGenerationException();
    expect(ex.message).toBe('Failed to generate token');
    expect(ex.code).toBe('AUTH_TOKEN_GENERATION_FAILED');
  });
});
