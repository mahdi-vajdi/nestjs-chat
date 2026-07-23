import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DomainException } from '../../exceptions/domain.exception';
import { mapDomainErrorTypeToHttpStatus } from '../../exceptions/exception-mapper';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    // Transform pure domain exceptions into standard NestJS REST responses
    if (exception instanceof DomainException) {
      const httpStatus = mapDomainErrorTypeToHttpStatus(exception.type);
      return httpAdapter.reply(
        ctx.getResponse(),
        {
          statusCode: httpStatus,
          message: exception.message,
          error: exception.code,
        },
        httpStatus,
      );
    }

    // Let standard NestJS HTTP exceptions pass through naturally
    if (exception instanceof HttpException) {
      return httpAdapter.reply(
        ctx.getResponse(),
        exception.getResponse(),
        exception.getStatus(),
      );
    }

    this.logger.error(
      `Unhandled exception: ${exception}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Unhandled internal errors
    httpAdapter.reply(
      ctx.getResponse(),
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
