import { StdStatus } from '@common/std-response/std-status';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';

export class StdResponse<T> {
  constructor(
    readonly data: T,
    readonly message: string,
    readonly status: StdStatus,
  ) {}

  static fromResult<T>(result: Result<T>): StdResponse<T> {
    if (result.isError()) {
      return new StdResponse<T>(
        result.error.data as T,
        result.error.message,
        StdResponse.toStdStatus(result.error.code),
      );
    }

    return new StdResponse<T>(result.value, 'Success', StdStatus.SUCCESS);
  }

  static toStdStatus(code: ErrorCode): StdStatus {
    switch (code) {
      case ErrorCode.NOT_FOUND:
        return StdStatus.NOT_FOUND;
      case ErrorCode.INVALID_ARGUMENT:
        return StdStatus.INVALID;
      case ErrorCode.FORBIDDEN:
        return StdStatus.FORBIDDEN;
      case ErrorCode.UNAUTHORIZED:
        return StdStatus.UNAUTHORIZED;
      case ErrorCode.DUPLICATE:
        return StdStatus.DUPLICATE;
      default:
        return StdStatus.INTERNAL_ERROR;
    }
  }
}
