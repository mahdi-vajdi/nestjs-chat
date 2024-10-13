import { AppError, ErrorCode } from '@common/result/error';

export class Result<T> {
  private constructor(
    private readonly _value: T | null,
    private readonly _error: AppError | null,
  ) {}

  get value(): T {
    if (this.isError()) {
      throw this._error!;
    }

    return this._value as T;
  }

  get error(): AppError {
    if (this.isOk()) {
      throw new AppError('Result has value', ErrorCode.INTERNAL, {
        value: this._value,
      });
    }

    return this._error!;
  }

  isOk(): boolean {
    return this._error === null;
  }

  isError(): boolean {
    return this._error !== null;
  }

  static ok<T>(value: T): Result<T> {
    return new Result(value, null);
  }

  static error<T = never>(
    error: AppError | Error | string,
    code?: ErrorCode,
    data: Record<string, unknown> = {},
  ): Result<T> {
    if (error instanceof AppError) return new Result<T>(null, error);

    if (error instanceof Error) {
      return new Result<T>(
        null,
        new AppError(error.message, code, { ...data, originalError: error }),
      );
    }

    return new Result<T>(null, new AppError(error as string, code, data));
  }
}
