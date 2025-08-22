import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards, UsePipes } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthWsGuard } from '@presentation/ws/guards/auth-ws.guard';
import { Result } from '@common/result/result';
import { AccessTokenPayload } from '@auth/types/access-token-payload.type';
import { ChatService } from '@chat/services/chat.service';
import { SocketMessage } from '@common/websocket/socket-message';
import { ValidationPipe } from '@common/validation/validation.pipe';
import {
  GetUserConversationListRequest,
  GetUserConversationListResponse,
  UserConversationListItem,
} from '@presentation/ws/gateways/dtos/get-user-conversation-list.dto';
import { PaginationHelper } from '@common/pagination/pagination.helper';
import { UserService } from '@user/services/user.service';
import { StdResponse } from '@common/std-response/std-response';
import { CurrentWsUser } from '@presentation/ws/decorators/current-ws-user.decorator';
import { UserEntity } from '@user/models/user.model';
import { ConversationType } from '@chat/enums/conversation-type.enum';

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
    private readonly userService: UserService,
  ) {}

  afterInit(server: Server) {
    this.logger.debug('Conversation gateway initialized successfully.');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.debug(`New client connected. id: ${client.id}`);

    if (!client.data['authPromise']) {
      client.data['authPromise'] = this.authWsGuard.authenticateUser(client);
    }

    const authRes: Result<AccessTokenPayload> =
      await client.data['authPromise'];
    if (authRes.isError()) {
      this.logger.debug(
        `Error from authentication: ${authRes.error.message}. disconnecting...`,
      );
      client.emit('appError', authRes.error.message);
      client.disconnect(true);
      return;
    }

    const conversationIdsRes = await this.chatService.getUserConversationIds(
      authRes.value.sub,
    );
    if (conversationIdsRes.isError()) {
      this.logger.error(
        `Error fetching conversation IDs for user ${authRes.value.sub}. disconnecting...`,
      );
      client.emit('error.internal', authRes.error);
      client.disconnect(true);
      return;
    }

    this.logger.debug(
      `Joining user ${authRes.value.sub} to conversations: ${conversationIdsRes.value}`,
    );
    client.join(conversationIdsRes.value);

    const userEventsRoom = `user-${authRes.value.sub}`;
    this.logger.debug(
      `Joining user ${authRes.value.sub} to room ${userEventsRoom}`,
    );
    client.join(userEventsRoom);

    this.logger.log(`Client authorized: ${authRes.value.sub}`);

    if (client.disconnected) {
      this.handleDisconnect(client);
    }
  }

  handleDisconnect(client: Socket): void {
    const authUser = client.data?.user;
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
  async ping(@MessageBody() msg: SocketMessage<string>) {
    msg.ack('pong');
  }

  @SubscribeMessage('user.conversation.list')
  @UsePipes(new ValidationPipe(GetUserConversationListRequest, ['body'], 'ws'))
  async getUserConversationList(
    @MessageBody() msg: SocketMessage<GetUserConversationListRequest>,
    @CurrentWsUser() currentUser: UserEntity,
  ): Promise<void> {
    const pagination = PaginationHelper.parse(msg.data.page, msg.data.pageSize);

    let filteredUserIds: string[] = [];
    if (msg.data.filter) {
      const userIdsRes = await this.userService.getUserIdsByNameOrUsername(
        msg.data.filter,
      );
      if (userIdsRes.isError()) {
        msg.ack(StdResponse.fromResult(userIdsRes));
        return;
      }
      filteredUserIds = userIdsRes.value;
    }

    if (msg.data.targetUserId) {
      filteredUserIds.push(msg.data.targetUserId);
    }

    if (msg.data.filter && filteredUserIds.length === 0) {
      msg.ack(
        StdResponse.fromResult(
          Result.ok<GetUserConversationListResponse>({
            list: [],
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: 0,
          }),
        ),
      );
      return;
    }

    const conversationListRes = await this.chatService.getUserConversationList(
      currentUser.id,
      pagination,
      filteredUserIds,
    );
    if (conversationListRes.isError()) {
      msg.ack(StdResponse.fromResult(conversationListRes));
      return;
    }

    const conversationsUserIds = conversationListRes.value.data
      .filter((c) => c.members.length != 0 && c.members[0].lastMessage)
      .map((c) => c.members[0].lastMessage.sender.userId);
    const usersRes = await this.userService.getUsersByIds(conversationsUserIds);
    if (usersRes.isError()) {
      msg.ack(usersRes);
      return;
    }

    msg.ack(
      StdResponse.fromResult(
        Result.ok<GetUserConversationListResponse>({
          list: conversationListRes.value.data.map((c) => {
            const currentMember = c.members.find(
              (m) => m.userId == currentUser.id,
            );
            const item: UserConversationListItem = {
              id: c.id,
              name: c.title,
              avatar: c.picture,
              username: c.identifier,
              lastMessage: c.lastMessage
                ? {
                    id: currentMember.lastMessage.id,
                    content: currentMember.lastMessage.text,
                    createdAt:
                      currentMember.lastMessage.createdAt.toISOString(),
                    seen: false,
                    user: null,
                  }
                : null,
              notSeenCount: currentMember.notSeenCount,
            };

            if (c.type === ConversationType.DIRECT) {
              const otherMember = c.members.find(
                (cm) => cm.userId != currentUser.id,
              );
              if (otherMember) {
                const otherUser = usersRes.value.find(
                  (u) => u.id == otherMember.userId,
                );
                if (otherUser) {
                  item.name = `${otherUser.firstName} ${otherUser.lastName}`;
                  item.username = otherUser.username;
                  item.avatar = otherUser.avatar;
                }
              }
            }

            return item;
          }),
          total: conversationListRes.value.meta.total,
          page: conversationListRes.value.meta.page,
          pageSize: conversationListRes.value.meta.pageSize,
        }),
      ),
    );
  }
}
