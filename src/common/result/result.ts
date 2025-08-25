import { AppError, ErrorCode } from '@common/result/error';

export class Result<T, E = null> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: AppError<E> | null,
  ) {}

  get value(): T {
    if (this.isError()) {
      throw this._error!;
    }

    return this._value as T;
  }

  get error(): AppError<E> {
    if (this.isOk()) {
      throw new AppError<E>(
        `Result has value: ${this.value}`,
        ErrorCode.INTERNAL,
      );
    }

    return this._error!;
  }

  static ok<T>(value: T): Result<T, null> {
    return new Result(value, null);
  }

  static error<E = null>(
    error: AppError<E> | Error | string,
    code: ErrorCode = ErrorCode.INTERNAL,
    data: E = null,
  ): Result<null, E> {
    if (error instanceof AppError) {
      return new Result<null, E>(null, error);
    }

    if (error instanceof Error) {
      return new Result<null, E>(
        null,
        new AppError<E>(error.message, code, data),
      );
    }

    return new Result<null, E>(null, new AppError<E>(error, code, data));
  }

  isOk(): boolean {
    return this._error === null;
  }

  isError(): boolean {
    return this._error !== null;
  }
}
