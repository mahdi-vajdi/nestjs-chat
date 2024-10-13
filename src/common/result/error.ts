export enum ErrCode {
  INVALID_ARGUMENT = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  FORBIDDEN = 403,
  VALIDATION_FAILURE = 422,
  INTERNAL = 500,
}

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: ErrCode,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = AppError.name;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
