import { GlobalWsExceptionFilter } from './global-ws-exception.filter';
import { WsException } from '@nestjs/websockets';

describe('GlobalWsExceptionFilter', () => {
  let filter: GlobalWsExceptionFilter;

  beforeEach(() => {
    filter = new GlobalWsExceptionFilter();
  });

  describe('catch', () => {
    it('should format and emit WsException', () => {
      const exception = new WsException('custom error');
      const client = { emit: jest.fn() };
      const host = {
        switchToWs: () => ({
          getClient: () => client,
          getPattern: () => 'pattern',
        }),
        getArgs: () => [client, {}, jest.fn()],
      } as any;

      filter.catch(exception, host);

      expect(client.emit).not.toHaveBeenCalledWith(
        'error.server',
        expect.anything(),
      );
    });

    it('should emit to client if no callback', () => {
      const exception = new Error('generic error');
      const client = { emit: jest.fn() };
      const host = {
        switchToWs: () => ({
          getClient: () => client,
          getPattern: () => 'pattern',
        }),
        getArgs: () => [client],
      } as any;

      filter.catch(exception, host);

      expect(client.emit).toHaveBeenCalledWith('error.server', {
        statusCode: 500,
        message: 'Internal server error',
      });
    });
  });
});
