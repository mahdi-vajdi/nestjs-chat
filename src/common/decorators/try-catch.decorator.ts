export function TryCatch(
  _target: any,
  _propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    try {
      const result = originalMethod.apply(this, args);

      if (result && result instanceof Promise) {
        return result.catch((error: any) => {
          throw error;
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  return descriptor;
}
