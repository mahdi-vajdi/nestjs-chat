import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';

export function TryCatch(
  _target: any,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    try {
      const res = originalMethod.apply(this, args);

      if (res instanceof Promise) {
        return res.then(
          (value) => Result.ok(value),
          (error) => Result.error(error, ErrorCode.INTERNAL),
        );
      }

      return Result.ok(res);
    } catch (error) {
      Result.error(error, ErrorCode.INTERNAL);
    }
  };

  return descriptor;
}
