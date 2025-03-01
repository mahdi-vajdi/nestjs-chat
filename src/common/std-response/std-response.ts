import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { StdStatus } from '@common/std-response/std-status';

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
      case ErrorCode.INVALID_ARGUMENT:
        return StdStatus.INVALID_ARGUMENT;
      case ErrorCode.UNAUTHENTICATED:
        return StdStatus.UNAUTHENTICATED;
      case ErrorCode.NOT_FOUND:
        return StdStatus.NOT_FOUND;
      case ErrorCode.PERMISSION_DENIED:
        return StdStatus.PERMISSION_DENIED;
      case ErrorCode.VALIDATION_FAILURE:
        return StdStatus.VALIDATION_FAILURE;
      case ErrorCode.ALREADY_EXISTS:
        return StdStatus.ALREADY_EXISTS;
      case ErrorCode.INTERNAL:
        return StdStatus.INTERNAL_ERROR;
      default:
        // This will throw a compile time error ig any case isn't handled
        return code;
    }
  }
}
