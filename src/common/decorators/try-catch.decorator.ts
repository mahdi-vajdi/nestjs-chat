import { Logger } from '@nestjs/common';
import { Result } from '@common/result/result';

const errorLogger = new Logger('TryCatch');

export function TryCatch(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      if (typeof error === 'string') {
        error = new Error(error);
      }
      errorLogger.error(
        `Error in ${propertyKey}@${target.constructor.name}: ${error.name} ${error.message}`,
        error.stack,
        target.constructor.name,
      );

      return Result.error(error);
    }
  };
}
