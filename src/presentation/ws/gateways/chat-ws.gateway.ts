import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthWsGuard } from '@presentation/ws/guards/auth-ws.guard';
import { Result } from '@common/result/result';
import { AccessTokenPayload } from '@auth/types/access-token-payload.type';
import { ChatService } from '@chat/services/chat.service';

@UseGuards(AuthWsGuard)
@WebSocketGateway({ namespace: 'chat', cors: '*' })
export class ChatWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatWsGateway.name);

  constructor(
    private readonly authWsGuard: AuthWsGuard,
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.logger.debug('Conversation gateway initialized successfully.');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.verbose('New client connected.');
    client.data = {
      data: {},
    };

    if (!client.data.data['authPromise']) {
      client.data.data['authPromise'] =
        this.authWsGuard.authenticateUser(client);
    }

    const authRes: Result<AccessTokenPayload> = client.data.data['authPromise'];
    if (authRes.isError()) {
      this.logger.debug(
        `Error from authentication: ${authRes.error.message}. disconnecting...`,
      );
      client.emit('error.auth', authRes.error);
      client.disconnect(true);
      return;
    }

    const conversationIdsRes = await this.chatService.getUserConversationIds(
      authRes.value.userId,
    );
    if (conversationIdsRes.isError()) {
      this.logger.error(
        `Error fetching conversation IDs for user ${authRes.value.userId}. disconnecting...`,
      );
      client.emit('error.internal', authRes.error);
      client.disconnect(true);
      return;
    }

    this.logger.debug(
      `Joining user ${authRes.value.userId} to conversations: ${conversationIdsRes.value}`,
    );
    client.join(conversationIdsRes.value);

    const userEventsRoom = `user-${authRes.value.userId}`;
    this.logger.debug(
      `Joining user ${authRes.value.userId} to room ${userEventsRoom}`,
    );
    client.join(userEventsRoom);

    this.logger.log(`Client authorized: ${authRes.value.userId}`);

    if (client.disconnected) {
      this.handleDisconnect(client);
    }
  }

  handleDisconnect(client: Socket): void {
    const authUser = client.data?.data?.user;
    if (authUser) {
      this.logger.log(`Client disconnected: ${authUser}`);

      for (const room of client.rooms) {
        if (room != client.id) {
          client.leave(room);
          this.logger.debug(`Leaving room: ${room}`);
        }
      }
    } else {
      this.logger.debug(`Unknown client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('ping')
  async ping() {}
}
