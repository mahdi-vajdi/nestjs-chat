import {
  ConnectedSocket,
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
import { AuthWsUserId } from '@presentation/ws/decorators/auth-ws-user-id.decorator';
import { ConversationType } from '@chat/enums/conversation-type.enum';
import { CreateConversationRequest } from '@presentation/ws/gateways/dtos/create-conversation.dto';
import { MessageType } from '@chat/enums/chat-type.enum';
import { BaseWsGateway } from '@common/websocket/base-ws.gateway';
import { ConversationCreatedEvent } from '@presentation/ws/events/conversation-created.event';
import { ErrorCode } from '@common/result/error';

@UseGuards(AuthWsGuard)
@WebSocketGateway({ namespace: 'chat', cors: '*' })
export class ChatWsGateway
  extends BaseWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatWsGateway.name);

  constructor(
    private readonly authWsGuard: AuthWsGuard,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {
    super();
  }

  getLogger(): Logger {
    return this.logger;
  }

  afterInit(_server: Server) {
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

  @SubscribeMessage('user.conversation.create')
  async createConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: SocketMessage<CreateConversationRequest>,
    @AuthWsUserId() authUserId: string,
  ) {
    const [currentUserRes, targetUserRes] = await Promise.all([
      this.userService.getUserById(authUserId),
      this.userService.getUserById(msg.data.targetUserId),
    ]);
    if (currentUserRes.isError()) {
      msg.ack(StdResponse.fromResult(currentUserRes));
      return;
    }
    if (targetUserRes.isError()) {
      msg.ack(StdResponse.fromResult(targetUserRes));
      return;
    }

    const blockStatusRes = await this.userService.getBlockStatus(
      authUserId,
      targetUserRes.value.id,
    );
    if (blockStatusRes.isError()) {
      msg.ack(StdResponse.fromResult(blockStatusRes));
      return;
    }
    if (blockStatusRes.value.isBlocker) {
      msg.ack(
        StdResponse.fromResult(
          Result.error(
            'You have blocked this user.',
            ErrorCode.VALIDATION_FAILURE,
          ),
        ),
      );
      return;
    }

    const createConversationRes =
      await this.chatService.createDirectConversation(
        currentUserRes.value.id,
        msg.data.targetUserId,
      );
    if (createConversationRes.isError()) {
      msg.ack(StdResponse.fromResult(createConversationRes));
    }

    const createMessageRes = await this.chatService.createMessage({
      type: MessageType.TEXT, // FIXME: make the type dynamic
      sender: createConversationRes.value.members.find(
        (m) => m.userId == currentUserRes.value.id,
      ),
      text: msg.data.content,
      conversation: createConversationRes.value,
      deletedForUserIds: blockStatusRes.value.isBlocked
        ? [targetUserRes.value.id]
        : [],
    });
    if (createMessageRes.isError()) {
      await this.chatService.deleteConversation(createConversationRes.value.id);
      msg.ack(StdResponse.fromResult(createMessageRes));
      return;
    }

    const userIds = [targetUserRes.value.id];
    const rooms = userIds
      .filter(
        (userId) => !createMessageRes.value.deletedForUserIds.includes(userId),
      )
      .map((userId) => `user-${userId}`);
    this.logger.debug(
      `broadcasting 'UserChatCreated' event to the rooms: ${rooms}`,
    );
    client.join(rooms);
    this.logger.log(
      `user ${currentUserRes.value.id} joined to room ${createMessageRes.value.conversation.id}`,
    );
    await this.broadcast(
      client,
      rooms,
      new ConversationCreatedEvent({
        id: createMessageRes.value.conversation.id,
        name: `${targetUserRes.value.firstName} ${targetUserRes.value.lastName}`,
        avatar: targetUserRes.value.avatar,
        username: targetUserRes.value.username,
        notSeenCount: 1,
        lastMessage: {
          id: createMessageRes.value.id,
          content: createMessageRes.value.text,
          createdAt: createMessageRes.value.createdAt.toISOString(),
          seen: false,
          user: {
            id: currentUserRes.value.id,
            name: `${currentUserRes.value.firstName} ${currentUserRes.value.lastName}`,
          },
        },
      }),
    );
  }

  @SubscribeMessage('user.conversation.list')
  @UsePipes(new ValidationPipe(GetUserConversationListRequest, ['body'], 'ws'))
  async getUserConversationList(
    @MessageBody() msg: SocketMessage<GetUserConversationListRequest>,
    @AuthWsUserId() authUserId: string,
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
      authUserId,
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
            const currentMember = c.members.find((m) => m.userId == authUserId);
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
                (cm) => cm.userId != authUserId,
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
