import { BroadcastProvider } from '@infrastructure/websocket/broadcast/providers/broadcast.provider';
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketIoBroadcast implements BroadcastProvider {
  private readonly logger = new Logger(SocketIoBroadcast.name);

  private server: Server;

  setServer(server: any): boolean {
    if (this.server) {
      this.logger.error('Socket.io broadcast server is already initialized');
      return false;
    }

    this.server = server;
    this.logger.log('Socket.io broadcast server has been initialized.');

    return true;
  }

  getServer() {
    return this.server;
  }
}
