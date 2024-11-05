import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: '*' })
export class ConversationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ConversationGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(server: any) {
    // throw new Error('Method not implemented.');
  }

  handleConnection(client: any, ...args: any[]) {
    // throw new Error('Method not implemented.');
  }

  handleDisconnect(client: any) {
    // throw new Error('Method not implemented.');
  }

  @SubscribeMessage('ping')
  async ping() {}
}
