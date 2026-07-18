import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { StdResponse } from '@common/std-response/std-response';
import { StdStatus } from '@common/std-response/std-status';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const pattern = host.switchToWs().getPattern();

    this.logger.error(`Exception in WS ${pattern}: ${exception}`);

    let response: StdResponse<any>;

    if (exception instanceof WsException) {
      const error = exception.getError();
      if (typeof error === 'string') {
        response = StdResponse.error(StdStatus.INTERNAL_ERROR, error);
      } else if (typeof error === 'object' && error['code']) {
        response = StdResponse.error(
          error['code'],
          error['message'] || 'An error occurred',
        );
      } else {
        response = StdResponse.error(
          StdStatus.INTERNAL_ERROR,
          'An unexpected error occurred',
        );
      }
    } else {
      response = StdResponse.error(
        StdStatus.INTERNAL_ERROR,
        'Internal server error',
      );
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
