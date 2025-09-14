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
  UserConversationListItem,
} from '@presentation/ws/gateways/dtos/get-user-conversation-list.dto';
import { PaginationHelper } from '@common/pagination/pagination.helper';
import { UserService } from '@user/services/user.service';
import { StdResponse } from '@common/std-response/std-response';
import { AuthWsUserId } from '@presentation/ws/decorators/auth-ws-user-id.decorator';
import { ConversationType } from '@chat/enums/conversation-type.enum';
import {
  CreateConversationRequest,
  CreateConversationResponse,
} from '@presentation/ws/gateways/dtos/create-conversation.dto';
import { MessageType } from '@chat/enums/chat-type.enum';
import { BaseWsGateway } from '@common/websocket/base-ws.gateway';
import { ConversationCreatedEvent } from '@presentation/ws/events/conversation-created.event';
import { ErrorCode } from '@common/result/error';
import { PaginatedResult } from '@common/pagination/pagination.interface';
import {
  CreateMessageRequest,
  CreateMessageResponseResponse,
} from '@presentation/ws/gateways/dtos/create-message.dto';
import { StdStatus } from '@common/std-response/std-status';
import {
  UserMessageCreated,
  UserMessageCreatedEvent,
} from '@presentation/ws/events/message-created.event';
import {
  GetConversationMessageListRequest,
  GetConversationMessageListResponse,
} from '@presentation/ws/gateways/dtos/get-conversation-message-list.dto';
import { MessageSeenEvent } from '@presentation/ws/events/message-seen.event';

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
  @UsePipes(new ValidationPipe(CreateConversationRequest, ['body'], 'ws'))
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

    msg.ack(
      StdResponse.success<CreateConversationResponse>({
        id: createConversationRes.value.id,
        username: createConversationRes.value.identifier,
        createdAt: createMessageRes.value.createdAt.toISOString(),
        avatar: createConversationRes.value.picture,
        name: `${targetUserRes.value.firstName} ${targetUserRes.value.lastName}`,
        chat: {
          id: createMessageRes.value.id,
          createdAt: createMessageRes.value.createdAt.toISOString(),
          seen: false,
          content: createMessageRes.value.text,
          user: {
            id: currentUserRes.value.id,
            name: `${currentUserRes.value.firstName} ${currentUserRes.value.lastName}`,
          },
        },
      }),
    );
  }

  @SubscribeMessage('conversation.list')
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
          Result.ok<PaginatedResult<UserConversationListItem>>(
            PaginationHelper.createResult([], 0, pagination),
          ),
        ),
      );
      return;
    }

    const conversationListRes = await this.chatService.getUserConversationList(
      authUserId,
      pagination,
      filteredUserIds.filter((userId) => userId && userId !== authUserId),
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
      StdResponse.success<PaginatedResult<UserConversationListItem>>({
        meta: conversationListRes.value.meta,
        data: conversationListRes.value.data.map((item) => {
          const currentMember = item.members.find(
            (m) => m.userId == authUserId,
          );
          const conversation: UserConversationListItem = {
            id: item.id,
            title: item.title,
            picture: item.picture,
            identifier: item.identifier,
            lastMessage: item.lastMessage
              ? {
                  id: currentMember.lastMessage.id,
                  text: currentMember.lastMessage.text,
                  createdAt: currentMember.lastMessage.createdAt.toISOString(),
                  seen: false,
                  user: null,
                }
              : null,
            notSeenCount: currentMember.notSeenCount,
          };

          if (item.type === ConversationType.DIRECT) {
            const otherMember = item.members.find(
              (cm) => cm.userId != authUserId,
            );
            if (otherMember) {
              const otherUser = usersRes.value.find(
                (u) => u.id == otherMember.userId,
              );
              if (otherUser) {
                conversation.title = `${otherUser.firstName} ${otherUser.lastName}`;
                conversation.identifier = otherUser.username;
                conversation.picture = otherUser.avatar;
              }
            }

            if (conversation.lastMessage) {
              const sender = usersRes.value.find(
                (user) =>
                  item.members[0].lastMessage &&
                  user.id === item.members[0].lastMessage.sender.userId,
              );
              if (sender) {
                conversation.lastMessage.user = {
                  id: sender.id,
                  username: sender.username,
                  name: `${sender.firstName} ${sender.lastName}`,
                };

                if (
                  conversation.lastMessage.user.id !== authUserId &&
                  item.members[0]?.lastSeenMessage
                ) {
                  conversation.lastMessage.seen =
                    conversation.lastMessage.id <=
                    item.members[0].lastSeenMessage.id;
                } else if (otherMember?.lastSeenMessage) {
                  conversation.lastMessage.seen =
                    conversation.lastMessage.id <=
                    otherMember.lastSeenMessage.id;
                } else {
                  // Nothing yet :\
                }
              }
            }
          }

          return conversation;
        }),
      }),
    );
  }

  @SubscribeMessage('user.conversation.message.create')
  @UsePipes(new ValidationPipe(CreateMessageRequest, ['body'], 'ws'))
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: SocketMessage<CreateMessageRequest>,
    @AuthWsUserId() authUserId: string,
  ): Promise<void> {
    const conversationRes = await this.chatService.getUserConversation(
      msg.data.conversationId,
      authUserId,
    );
    if (conversationRes.isError()) {
      msg.ack(StdResponse.fromResult(conversationRes));
      return;
    }

    const targetMember = conversationRes.value.members.find(
      (member) => member.userId !== authUserId,
    );
    if (!targetMember) {
      msg.ack(StdResponse.error(StdStatus.NOT_FOUND, 'Conversation not found'));
    }

    const [currentUserRes, targetUserRes, blockStatusRes] = await Promise.all([
      this.userService.getUserById(authUserId),
      this.userService.getUserById(targetMember.userId),
      this.userService.getBlockStatus(authUserId, targetMember.userId),
    ]);
    if (targetUserRes.isError()) {
      msg.ack(StdResponse.fromResult(targetUserRes));
      return;
    }
    if (blockStatusRes.isError()) {
      msg.ack(StdResponse.fromResult(blockStatusRes));
      return;
    }

    if (blockStatusRes.value.isBlocker) {
      msg.ack(
        StdResponse.error(
          StdStatus.VALIDATION_FAILURE,
          'You need to unblock the user before sending a message.',
        ),
      );
      return;
    }

    const createMessageRes = await this.chatService.createMessage({
      conversation: { id: conversationRes.value.id },
      type: MessageType.TEXT,
      text: msg.data.text,
      sender: {
        id: conversationRes.value.members.find(
          (member) => member.userId === authUserId,
        ).id,
      },
      deletedForUserIds: blockStatusRes.value.isBlocked
        ? [targetUserRes.value.id]
        : [],
    });
    if (createMessageRes.isError()) {
      msg.ack(StdResponse.fromResult(createMessageRes));
      return;
    }

    let rooms = [targetUserRes.value.id];
    rooms = rooms.filter(
      (x) => !createMessageRes.value.deletedForUserIds.includes(x),
    );

    await this.broadcast<UserMessageCreated>(
      client,
      rooms,
      new UserMessageCreatedEvent({
        id: createMessageRes.value.id,
        seen: false,
        createdAt: createMessageRes.value.createdAt.toISOString(),
        user: {
          id: currentUserRes.value.id,
          username: currentUserRes.value.username,
          name: `${currentUserRes.value.firstName} ${currentUserRes.value.lastName}`,
          avatar: currentUserRes.value.avatar,
        },
        content: createMessageRes.value.text,
        conversation: {
          id: conversationRes.value.id,
          name: conversationRes.value.id,
          avatar: conversationRes.value.picture,
          username: conversationRes.value.identifier,
        },
      }),
    );

    msg.ack(
      StdResponse.success<CreateMessageResponseResponse>({
        id: createMessageRes.value.id,
        createdAt: createMessageRes.value.createdAt.toISOString(),
        seen: false,
        user: {
          id: currentUserRes.value.id,
          name: `${currentUserRes.value.firstName} ${currentUserRes.value.lastName}`,
        },
        content: createMessageRes.value.text,
      }),
    );
  }

  @SubscribeMessage('user.conversation.message.list')
  @UsePipes(
    new ValidationPipe(GetConversationMessageListRequest, ['body'], 'ws'),
  )
  async getConversationMessageList(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: SocketMessage<GetConversationMessageListRequest>,
    @AuthWsUserId() authUserId: string,
  ) {
    const conversationRes = await this.chatService.getUserConversation(
      msg.data.conversationId,
      authUserId,
    );
    if (conversationRes.isError()) {
      msg.ack(StdResponse.fromResult(conversationRes));
      return;
    }

    const pagination = PaginationHelper.parse(msg.data.page, msg.data.pageSize);

    const messageListRes =
      await this.chatService.getUserConversationMessageList(
        msg.data.conversationId,
        authUserId,
        pagination,
      );
    if (messageListRes.isError()) {
      msg.ack(StdResponse.fromResult(messageListRes));
      return;
    }

    let userIds = messageListRes.value.data.map(
      (message) => message.sender.userId,
    );
    userIds.push(
      ...conversationRes.value.members.map((member) => member.userId),
    );
    userIds = Array.from(new Set(userIds));

    const usersRes = await this.userService.getUsersByIds(userIds);
    if (usersRes.isError()) {
      msg.ack(StdResponse.fromResult(usersRes));
      return;
    }

    const blockedUserIdsRes = await this.userService.getBlockedUsersIds(
      authUserId,
      usersRes.value.map((user) => user.id),
    );

    if (messageListRes.value.data.length) {
      await this.broadcast(
        client,
        conversationRes.value.members
          .filter((member) => member.userId !== authUserId)
          .map((member) => member.id),
        new MessageSeenEvent({
          conversationId: conversationRes.value.id,
          messageId:
            messageListRes.value.data[messageListRes.value.data.length - 1].id,
        }),
      );
    }

    msg.ack(
      StdResponse.success<GetConversationMessageListResponse>({
        id: conversationRes.value.id,
        name:
          conversationRes.value.type == ConversationType.DIRECT
            ? usersRes.value.find((m) => m.id != authUserId)?.firstName
            : conversationRes.value.title,
        avatar:
          conversationRes.value.type == ConversationType.DIRECT
            ? usersRes.value.find((m) => m.id != authUserId)?.firstName
            : conversationRes.value.title,
        username:
          conversationRes.value.type == ConversationType.DIRECT
            ? usersRes.value.find((m) => m.id != authUserId)?.username
            : conversationRes.value.identifier,
        members: usersRes.value
          .filter((user) => user.id != authUserId)
          .map((m) => ({
            id: m.id,
            avatar: m.avatar,
            username: m.username,
            name: m.firstName,
            isBlocked: blockedUserIdsRes.value.includes(m.id),
          })),
        messages: {
          total: messageListRes.value.meta.total,
          page: messageListRes.value.meta.page,
          pageSize: messageListRes.value.meta.pageSize,
          list: messageListRes.value.data.map((item) => {
            const user = usersRes.value.find((u) => u.id == item.sender.userId);
            const message = {
              id: item.id,
              content: item.text,
              createdAt: item.createdAt.toISOString(),
              seen: false,
              user: user
                ? {
                    id: user.id,
                    name: user.firstName,
                  }
                : null,
            };

            if (message.user.id === authUserId) {
              const otherMember = conversationRes.value.members.find(
                (m) => m.userId !== authUserId,
              );
              if (message.id < otherMember.lastSeenMessage.id) {
                message.seen = true;
              }
            }

            return message;
          }),
        },
      }),
    );
  }
}
