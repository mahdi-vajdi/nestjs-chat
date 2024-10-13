import { AppError, ErrorCode } from '@common/result/error';

export class Result<T, E = undefined> {
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

  isOk(): boolean {
    return this._error === null;
  }

  isError(): boolean {
    return this._error !== null;
  }

  static ok<T>(value: T): Result<T> {
    return new Result(value, null);
  }

  static error<E = undefined, T extends never = never>(
    error: AppError | Error | string,
    code?: ErrorCode,
    data?: E,
  ): Result<T, E> {
    if (error instanceof AppError) return new Result<T, E>(null, error);

    if (error instanceof Error) {
      new AppError<E>(error.message, code, data);
    }

    return new Result<T, E>(null, new AppError<E>(error as string, code, data));
  }
}
