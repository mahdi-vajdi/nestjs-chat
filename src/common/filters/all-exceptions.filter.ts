import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainException } from '../exceptions/domain.exception';
import { mapDomainErrorTypeToHttpStatus } from '../exceptions/exception-mapper';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Transform pure domain exceptions into standard NestJS REST responses
    if (exception instanceof DomainException) {
      const httpStatus = mapDomainErrorTypeToHttpStatus(exception.type);
      return response.status(httpStatus).json({
        statusCode: httpStatus,
        message: exception.message,
        error: exception.code,
      });
    }

    // Let standard NestJS HTTP exceptions pass through naturally
    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }

    this.logger.error(
      `Unhandled exception: ${exception}`,
      (exception as any)?.stack,
    );

    // Unhandled internal errors
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
