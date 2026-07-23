import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { DomainException } from '@common/exceptions/domain.exception';
import { mapDomainErrorTypeToHttpStatus } from '@common/exceptions/exception-mapper';

@Catch()
export class GlobalWsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(GlobalWsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const pattern = host.switchToWs().getPattern();

    this.logger.error(`Exception in WS ${pattern}: ${exception}`);

    let response: any;

    if (exception instanceof DomainException) {
      response = {
        statusCode: mapDomainErrorTypeToHttpStatus(exception.type),
        message: exception.message,
        code: exception.code,
      };
    } else if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') {
        response = { statusCode: 500, message: error };
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error
      ) {
        response = {
          statusCode: error['code'],
          message: error['message'] || 'An error occurred',
        };
      } else {
        response = { statusCode: 500, message: 'An unexpected error occurred' };
      }
    } else {
      response = { statusCode: 500, message: 'Internal server error' };
    }

    if (typeof client.emit === 'function' && pattern) {
      const args = host.getArgs();
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback(response);
      } else {
        client.emit('exception', response);
      }
    }
  }
}
