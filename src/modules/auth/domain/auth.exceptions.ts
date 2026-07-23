import { DomainException } from '@common/exceptions/domain.exception';

export class InvalidRefreshTokenException extends DomainException {
  constructor(reason?: string) {
    super(
      reason
        ? `Refresh token is invalid or expired: ${reason}`
        : 'Refresh token is invalid or expired',
      'AUTH_INVALID_REFRESH_TOKEN',
      'UNAUTHORIZED',
    );
  }
}

export class TokenGenerationException extends DomainException {
  constructor(reason?: string) {
    super(
      reason
        ? `Failed to generate token: ${reason}`
        : 'Failed to generate token',
      'AUTH_TOKEN_GENERATION_FAILED',
      'INTERNAL_ERROR',
    );
  }
}

export class AuthDomainError extends DomainException {
  constructor(message: string) {
    super(message, 'AUTH_DOMAIN_ERROR', 'BUSINESS_RULE');
  }
}
