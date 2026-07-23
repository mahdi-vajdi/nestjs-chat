import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { DomainException } from '@common/exceptions/domain.exception';
import { mapDomainErrorTypeToHttpStatus } from '@common/exceptions/exception-mapper';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

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
      } else if (typeof error === 'object' && error['code']) {
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
      // Return error using event acknowledgement if possible, otherwise emit to socket
      // Actually standard NestJS acknowledgement via exception filter:
      // In NestJS WS, returning from a filter doesn't trigger the ack. We must call the callback directly if it exists in args.
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
