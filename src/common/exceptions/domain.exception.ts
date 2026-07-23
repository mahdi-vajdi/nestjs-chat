export type DomainErrorType =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BUSINESS_RULE'
  | 'INTERNAL_ERROR'
  | 'TOO_MANY_REQUESTS';

export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly type: DomainErrorType;

  protected constructor(
    public readonly message: string,
    code: string,
    type: DomainErrorType = 'BUSINESS_RULE',
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.type = type;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
