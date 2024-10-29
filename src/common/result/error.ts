export enum ErrorCode {
  INVALID_ARGUMENT,
  UNAUTHORIZED,
  NOT_FOUND,
  FORBIDDEN,
  VALIDATION_FAILURE,
  DUPLICATE,
  INTERNAL,
}

export class AppError<T = undefined> extends Error {
  constructor(
    message: string,
    readonly code: ErrorCode,
    readonly data?: T,
  ) {
    super(message);
    this.name = AppError.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
