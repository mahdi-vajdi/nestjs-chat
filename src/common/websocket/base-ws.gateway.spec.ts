import { BaseWsGateway } from './base-ws.gateway';
import { Server, Socket } from 'socket.io';
import { BaseWsEvent } from './base-ws-event';

class TestGateway extends BaseWsGateway {
  server: Server;

  constructor() {
    super();
    this.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;
  }

  getLogger() {
    return { log: jest.fn(), error: jest.fn(), debug: jest.fn() } as any;
  }
}

class TestEvent extends BaseWsEvent<any> {
  get eventName() {
    return 'test.event';
  }
}

describe('BaseWsGateway', () => {
  let gateway: TestGateway;

  beforeEach(() => {
    gateway = new TestGateway();
  });

  describe('broadcast', () => {
    it('should broadcast event to rooms', async () => {
      const client = {
        broadcast: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
      } as unknown as Socket;
      const event = new TestEvent({ data: 'val' });

      await gateway.broadcast(client, ['room-1'], event);

      expect(client.broadcast.to).toHaveBeenCalledWith(['room-1']);
      expect((client.broadcast.to as any)().emit).toHaveBeenCalledWith(
        'test.event',
        { data: 'val' },
      );
    });
  });
});
