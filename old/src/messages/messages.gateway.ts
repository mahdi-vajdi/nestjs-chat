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
import { Logger, UseGuards } from '@nestjs/common';
import {
  SocketAuthMiddleware,
  SocketWithAuth,
} from 'src/auth/ws-auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { WsJwtAuthGuard } from 'src/auth/guards/ws-jwt.guard';
import { MessageSeenDto } from './dto/MessageSeenDto';
import { Message } from './interfaces/message.interface';

@WebSocketGateway({
  namespace: 'messages',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtAuthGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagesGateway.name);

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
  afterInit(client: SocketWithAuth) {
    client.use(SocketAuthMiddleware(this.jwtService) as any);
  }

  async handleConnection(client: SocketWithAuth) {
    this.logger.log('Socket connected: ', {
      time: new Date(),
      socketId: client.id,
      chatId: client.handshake.query['chatId'],
      username: client.username,
    });
    this.messagesService.onSocketConnected(
      client.handshake.query['chatId'] as string,
      client.username,
      client.id,
    );
  }

  async handleDisconnect(client: SocketWithAuth) {
    this.logger.log('Socket disconnected: ', {
      time: new Date(),
      socketId: client.id,
      chatId: client.handshake.query['chatId'],
      username: client.username,
    });
    this.messagesService.onSocketDisconnected(
      client.handshake.query['chatId'] as string,
      client.username,
    );
  }

  @SubscribeMessage('createMessage')
  async createMessage(
    @MessageBody() { text }: CreateMessageDto,
    @ConnectedSocket() client: SocketWithAuth,
  ) {
    const message: Message = await this.messagesService.createMessage(
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
  async findAllChatMessages(@ConnectedSocket() client: SocketWithAuth) {
    const messages = await this.messagesService.findAllChatMessages(
      client.handshake.query['chatId'] as string,
    );
    return messages;
  }

  @SubscribeMessage('messageSeen')
  async seenMessage(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody()
    { messageId, senderUsername, chatId }: MessageSeenDto,
  ) {
    this.messagesService.messageSeen(messageId);
    const senderSocket = await this.messagesService.getSocket(
      chatId,
      senderUsername,
    );

    if (senderSocket)
      this.server.to(senderSocket).emit('seenMessage', { chatId, messageId });
  }
}
