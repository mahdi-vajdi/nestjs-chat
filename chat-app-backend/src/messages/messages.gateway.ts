import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import {
  SocketAuthMiddleware,
  SocketWithUser,
} from 'src/auth/ws-auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { WsJwtAuthGuard } from 'src/auth/guards/ws-jwt.guard';
import { ResponseMessage } from './interfaces/response-message.interface';

@WebSocketGateway({ namespace: 'messages' })
@UseGuards(WsJwtAuthGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly jwtService: JwtService,
  ) {}

  /* 
  Using WsJwtAuthGuard as a middleware so we
  can authenticate user before any socket connection being stablished. 
  */
  afterInit(client: SocketWithUser) {
    client.use(SocketAuthMiddleware(this.jwtService) as any);
  }

  async handleConnection(client: SocketWithUser) {
    this.messagesService.onSocketConnected(
      client.handshake.query['chatId'] as string,
      client.username,
      client.id,
    );
  }

  async handleDisconnect(client: SocketWithUser) {
    this.messagesService.onSocketDisconnected(client.username);
  }

  @SubscribeMessage('createMessage')
  async createMessage(
    @MessageBody() { text }: CreateMessageDto,
    @ConnectedSocket() client: SocketWithUser,
  ) {
    const message: ResponseMessage = await this.messagesService.createMessage(
      text,
      client.handshake.query['chatId'] as string,
      client.username,
    );

    // See if receiver is connected and get its socket id
    const receiverSocket = await this.messagesService.getSocket(
      client.handshake.query['chatId'] as string,
      message.receiver,
    );

    if (receiverSocket) {
      this.server.to(receiverSocket).emit('message', { message });
    }

    return message;
  }

  @SubscribeMessage('getAllMessages')
  async findAllChatMessages(@ConnectedSocket() client: SocketWithUser) {
    const messages = await this.messagesService.findAllChatMessages(
      client.handshake.query['chatId'] as string,
    );
    return messages;
  }
}
