import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { AuthWsGuard } from '@presentation/guards/auth-ws.guard';

@UseGuards(AuthWsGuard)
@WebSocketGateway({ cors: '*' })
export class ConversationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ConversationGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(server: any) {
    this.logger.debug('Conversation gateway initialized successfully.');
  }

  handleConnection(client: any, ...args: any[]) {
    // TODO: Join user to the conversations
  }

  handleDisconnect(client: any) {
    // TODO: Remove user from the conversations
  }

  @SubscribeMessage('ping')
  async ping() {}
}
