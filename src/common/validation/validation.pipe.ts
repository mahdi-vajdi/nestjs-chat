import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Paramtype,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { StdResponse } from '@common/std-response/std-response';
import { ValidationFailure } from './validation-failure';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(
    private readonly model: any,
    private readonly types: Paramtype[],
    private readonly transport: 'http' | 'ws',
  ) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (
      !this.types.includes(metadata.type) ||
      !this.model ||
      !this.toValidate(this.model)
    ) {
      return value;
    }

    let oldValue = value;
    let ack = null;

    if (this.transport === 'ws') {
      oldValue = value.data;
      ack = value.ack;
    } else if (this.transport === 'http' && metadata.type === 'param') {
      // For params, I wrap the single param value in an object
      oldValue = { [metadata.data]: value };
    }

    const newValue = plainToInstance(this.model, oldValue);
    const errors = await validate(newValue);

    if (errors.length > 0) {
      const response = StdResponse.fromResult(
        Result.error(
          'Validation Error',
          ErrorCode.INVALID_ARGUMENT,
          this.formatErrors(errors),
        ),
      );

      if (this.transport === 'http') {
        throw new BadRequestException(response);
      } else if (this.transport === 'ws') {
        if (ack) {
          ack(response);
        }
        throw new WsException(response);
      }
    }

    return value;
  }

  private toValidate(type: Type): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(type as any);
  }

  private formatErrors(errors: ValidationError[]): ValidationFailure[] {
    const failures: ValidationFailure[] = [];

    const flattenErrors = (error: ValidationError, parentPath: string = '') => {
      const currentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;

      if (error.constraints) {
        for (const message of Object.values(error.constraints)) {
          failures.push(new ValidationFailure(currentPath, message));
        }
      }

      if (error.children && error.children.length > 0) {
        for (const childError of error.children) {
          flattenErrors(childError, currentPath);
        }
      }
    };

    errors.forEach((error) => flattenErrors(error));

    return failures;
  }
}
