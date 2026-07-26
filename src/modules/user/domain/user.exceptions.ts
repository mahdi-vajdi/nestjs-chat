import { DomainException } from '@common/exceptions/domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(identifier?: string) {
    super(
      identifier
        ? `User with identifier ${identifier} not found`
        : 'User not found',
      'USER_NOT_FOUND',
      'NOT_FOUND',
    );
  }
}

export class UserAlreadyExistsException extends DomainException {
  constructor(reason?: string) {
    super(
      reason ? `User already exists: ${reason}` : 'User already exists',
      'USER_ALREADY_EXISTS',
      'CONFLICT',
    );
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor(reason?: string) {
    super(
      reason
        ? `Username or password combination is invalid: ${reason}`
        : 'Username or password combination is invalid',
      'USER_INVALID_CREDENTIALS',
      'UNAUTHORIZED',
    );
  }
}

export class UserDomainError extends DomainException {
  constructor(message: string) {
    super(message, 'USER_DOMAIN_ERROR', 'BUSINESS_RULE');
  }
}
