import {
  ArgumentMetadata,
  Injectable,
  Paramtype,
  PipeTransform,
  Type,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { StdResponse } from '@common/std-response/std-response';
import { Result } from '@common/result/result';
import { ValidationFailure } from './validation-failure';
import { ErrorCode } from '@common/result/error';

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(
    private readonly types: Paramtype,
    private readonly transport: 'http' | 'ws',
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (
      !this.types.includes(metadata.type) ||
      !metadata.metatype ||
      !this.toValidate(metadata.metatype)
    ) {
      return value;
    }

    let oldValue = value;
    let ack = null;
    if (this.transport === 'ws') {
      oldValue = value.data;
      ack = value.ack;
    }

    const newValue = plainToInstance(metadata.metatype, oldValue);
    const errors = await validate(newValue);

    if (errors.length > 0) {
      if (this.transport === 'ws' && ack) {
        ack(
          StdResponse.fromResult<ValidationFailure[]>(
            this.formatErrors(errors),
          ),
        );
      }

      if (this.transport === 'http') {
        throw new UnprocessableEntityException(
          StdResponse.fromResult(this.formatErrors(errors)),
        );
      }
    }
  }

  private toValidate(metatype: Type<any>): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype as any);
  }

  private formatErrors(validationErrors: ValidationError[]): Result<any, any> {
    const errors: ValidationFailure[] = [];

    // Transform validation errors into ValidationFailure instances and push them to the array.
    validationErrors.forEach((error) => {
      if (error.constraints) {
        for (const failure of Object.values(error.constraints)) {
          errors.push(new ValidationFailure(error.property, failure));
        }
      }

      if (error.children) {
        for (const subError of error.children) {
          errors.push(
            new ValidationFailure(subError.property, error.property + '.'),
          );
        }
      }

      return errors;
    });

    return Result.error(
      'Validation Error',
      ErrorCode.VALIDATION_FAILURE,
      errors,
    );
  }
}
