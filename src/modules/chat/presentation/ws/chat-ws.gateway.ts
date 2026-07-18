import { GetUserConversationIdsQuery } from '@chat/application/queries/get-user-conversation-ids/get-user-conversation-ids.query';
import { CreateDirectConversationCommand } from '@chat/application/commands/create-direct-conversation/create-direct-conversation.command';
import { CreateMessageCommand } from '@chat/application/commands/create-message/create-message.command';
import { DeleteConversationCommand } from '@chat/application/commands/delete-conversation/delete-conversation.command';
import { GetUserConversationListQuery } from '@chat/application/queries/get-user-conversation-list/get-user-conversation-list.query';
import { GetUserConversationQuery } from '@chat/application/queries/get-user-conversation/get-user-conversation.query';
import { GetUserConversationMessageListQuery } from '@chat/application/queries/get-user-conversation-message-list/get-user-conversation-message-list.query';
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
import { ChatWsGuard } from '@chat/presentation/ws/guards/chat-ws.guard';
import { Result } from '@common/result/result';
import { ValidatedTokenPayload } from '@chat/application/ports/auth-integration.port';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SocketMessage } from '@common/websocket/socket-message';
import { ValidationPipe } from '@common/validation/validation.pipe';
import {
  GetUserConversationListRequest,
  UserConversationListItem,
} from '@chat/presentation/ws/dtos/get-user-conversation-list.dto';
import { PaginationHelper } from '@common/pagination/pagination.helper';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { StdResponse } from '@common/std-response/std-response';
import { CurrentWsUserId } from '@common/websocket/decorators/current-ws-user-id.decorator';
import { ConversationType } from '@chat/domain/enums/conversation-type.enum';
import {
  CreateConversationRequest,
  CreateConversationResponse,
} from '@chat/presentation/ws/dtos/create-conversation.dto';
import { MessageType } from '@chat/domain/enums/chat-type.enum';
import { BaseWsGateway } from '@common/websocket/base-ws.gateway';
import { ConversationCreatedEvent } from '@chat/presentation/ws/events/conversation-created.event';
import { ErrorCode } from '@common/result/error';
import { PaginatedResult } from '@common/pagination/pagination.interface';
import {
  CreateMessageRequest,
  CreateMessageResponseResponse,
} from '@chat/presentation/ws/dtos/create-message.dto';
import { StdStatus } from '@common/std-response/std-status';
import { MarkConversationAsReadCommand } from '@chat/application/commands/mark-conversation-as-read/mark-conversation-as-read.command';
import {
  GetConversationMessageListRequest,
  GetConversationMessageListResponse,
} from '@chat/presentation/ws/dtos/get-conversation-message-list.dto';
import { MessageSeenEvent } from '@chat/presentation/ws/events/message-seen.event';

@UseGuards(ChatWsGuard)
@WebSocketGateway({ namespace: 'chat', cors: '*' })
export class ChatWsGateway
  extends BaseWsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(ChatWsGateway.name);

  constructor(
    private readonly chatWsGuard: ChatWsGuard,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly userIntegrationPort: UserIntegrationPort,
  ) {
    super();
  }

  getLogger(): Logger {
    return this.logger;
  }

  afterInit() {
    this.logger.debug('Conversation gateway initialized successfully.');
  }

  async handleConnection(client: Socket) {
    this.logger.debug(`New client connected. id: ${client.id}`);

    if (!client.data['authPromise']) {
      client.data['authPromise'] = this.chatWsGuard.authenticateUser(client);
    }

    const authRes: Result<ValidatedTokenPayload> =
      await client.data['authPromise'];
    if (authRes.isError()) {
      this.logger.debug(
        `Error from authentication: ${authRes.error.message}. disconnecting...`,
      );
      client.emit('appError', authRes.error.message);
      client.disconnect(true);
      return;
    }

    const conversationIdsRes = await this.queryBus.execute(
      new GetUserConversationIdsQuery(authRes.value.sub, {}),
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
  }

  handleDisconnect(client: Socket): void {
    const authUser = client.data?.user;
    if (authUser) {
      this.logger.log(`Client disconnected: ${authUser}`);
    } else {
      this.logger.debug(`Unknown client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('conversation.direct.create')
  @UsePipes(new ValidationPipe(CreateConversationRequest, ['body'], 'ws'))
  async createDirectConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: SocketMessage<CreateConversationRequest>,
    @CurrentWsUserId() authUserId: string,
  ) {
    const [currentUserRes, targetUserRes] = await Promise.all([
      this.userIntegrationPort.getUserById(authUserId),
      this.userIntegrationPort.getUserById(msg.data.targetUserId),
    ]);
    if (currentUserRes.isError()) {
      msg.ack(StdResponse.fromResult(currentUserRes));
      return;
    }
    if (targetUserRes.isError()) {
      msg.ack(StdResponse.fromResult(targetUserRes));
      return;
    }

    const blockStatusRes = await this.userIntegrationPort.getBlockStatus(
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

    const createConversationRes = await this.commandBus.execute(
      new CreateDirectConversationCommand(
        currentUserRes.value.id,
        msg.data.targetUserId,
      ),
    );
    if (createConversationRes.isError()) {
      msg.ack(StdResponse.fromResult(createConversationRes));
    }

    const createMessageRes = await this.commandBus.execute(
      new CreateMessageCommand(
        msg.data.content,
        MessageType.TEXT,
        currentUserRes.value.id,
        createConversationRes.value.id,
        blockStatusRes.value.isBlocked ? [targetUserRes.value.id] : [],
      ),
    );

    if (createMessageRes.isError()) {
      await this.commandBus.execute(
        new DeleteConversationCommand(createConversationRes.value.id),
      );
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
    this.logger.log(
      `user ${currentUserRes.value.id} joined to room ${createMessageRes.value.conversation.id}`,
    );
    await this.broadcast(
      client,
      rooms,
      new ConversationCreatedEvent({
        id: createMessageRes.value.conversationId,
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
    @CurrentWsUserId() authUserId: string,
  ): Promise<void> {
    const pagination = PaginationHelper.parse(msg.data.page, msg.data.pageSize);

    let filteredUserIds: string[] = [];
    if (msg.data.filter) {
      const userIdsRes =
        await this.userIntegrationPort.getUserIdsByNameOrUsername(
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

    const conversationListRes = await this.queryBus.execute(
      new GetUserConversationListQuery(authUserId, {
        pagination,
        filterUserIds: filteredUserIds.filter(
          (userId) => userId && userId !== authUserId,
        ),
        withLastMessage: true,
      }),
    );
    if (conversationListRes.isError()) {
      msg.ack(StdResponse.fromResult(conversationListRes));
      return;
    }

    const conversationsUserIds = conversationListRes.value.data
      .map((c) => c.lastMessage?.senderId)
      .filter((id) => id != null);
    const allUsersInvolved = conversationListRes.value.data.flatMap((c) =>
      c.members.map((m) => m.userId),
    );
    allUsersInvolved.push(...conversationsUserIds);
    const uniqueUserIds = Array.from(new Set(allUsersInvolved)) as string[];

    const usersRes =
      await this.userIntegrationPort.getUsersByIds(uniqueUserIds);
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
                  id: item.lastMessage.id,
                  text: item.lastMessage.text,
                  createdAt: item.lastMessage.createdAt,
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
                (user) => user.id === item.lastMessage.senderId,
              );
              if (sender) {
                conversation.lastMessage.user = {
                  id: sender.id,
                  username: sender.username,
                  name: `${sender.firstName} ${sender.lastName}`,
                };

                if (sender.id === authUserId) {
                  if (
                    otherMember?.lastSeenMessage &&
                    item.lastMessage.createdAt <=
                      otherMember.lastSeenMessage.createdAt
                  ) {
                    conversation.lastMessage.seen = true;
                  }
                } else {
                  if (currentMember?.lastSeenMessage) {
                    conversation.lastMessage.seen =
                      item.lastMessage.createdAt <=
                      currentMember.lastSeenMessage.createdAt;
                  }
                }
              }
            }
          }

          return conversation;
        }),
      }),
    );
  }

  @SubscribeMessage('conversation.message.create')
  @UsePipes(new ValidationPipe(CreateMessageRequest, ['body'], 'ws'))
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: SocketMessage<CreateMessageRequest>,
    @CurrentWsUserId() authUserId: string,
  ): Promise<void> {
    const conversationRes = await this.queryBus.execute(
      new GetUserConversationQuery(msg.data.conversationId, authUserId),
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
      this.userIntegrationPort.getUserById(authUserId),
      this.userIntegrationPort.getUserById(targetMember.userId),
      this.userIntegrationPort.getBlockStatus(authUserId, targetMember.userId),
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

    const createMessageRes = await this.commandBus.execute(
      new CreateMessageCommand(
        msg.data.text,
        MessageType.TEXT,
        authUserId,
        conversationRes.value.id,
        blockStatusRes.value.isBlocked ? [targetUserRes.value.id] : [],
      ),
    );
    if (createMessageRes.isError()) {
      msg.ack(StdResponse.fromResult(createMessageRes));
      return;
    }

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

  @SubscribeMessage('conversation.message.list')
  @UsePipes(
    new ValidationPipe(GetConversationMessageListRequest, ['body'], 'ws'),
  )
  async getConversationMessageList(
    @ConnectedSocket() client: Socket,
    @MessageBody() msg: SocketMessage<GetConversationMessageListRequest>,
    @CurrentWsUserId() authUserId: string,
  ) {
    const conversationRes = await this.queryBus.execute(
      new GetUserConversationQuery(msg.data.conversationId, authUserId),
    );
    if (conversationRes.isError()) {
      msg.ack(StdResponse.fromResult(conversationRes));
      return;
    }

    const pagination = PaginationHelper.parse(msg.data.page, msg.data.pageSize);

    const messageListRes = await this.queryBus.execute(
      new GetUserConversationMessageListQuery(
        msg.data.conversationId,
        authUserId,
        pagination,
      ),
    );
    if (messageListRes.isError()) {
      msg.ack(StdResponse.fromResult(messageListRes));
      return;
    }

    let userIds = messageListRes.value.data.map((message) => message.senderId);
    userIds.push(
      ...conversationRes.value.members.map((member) => member.userId),
    );
    userIds = Array.from(new Set(userIds));

    const usersRes = await this.userIntegrationPort.getUsersByIds(userIds);
    if (usersRes.isError()) {
      msg.ack(StdResponse.fromResult(usersRes));
      return;
    }

    const blockedUserIdsRes = await this.userIntegrationPort.getBlockedUsersIds(
      authUserId,
      usersRes.value.map((user) => user.id),
    );

    if (messageListRes.value.data.length) {
      await this.commandBus.execute(
        new MarkConversationAsReadCommand(
          conversationRes.value.id,
          authUserId,
          messageListRes.value.data[0].id,
        ),
      );

      await this.broadcast(
        client,
        conversationRes.value.members
          .filter((member) => member.userId !== authUserId)
          .map((member) => `user-${member.userId}`),
        new MessageSeenEvent({
          conversationId: conversationRes.value.id,
          messageId: messageListRes.value.data[0].id,
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
            ? usersRes.value.find((m) => m.id != authUserId)?.avatar
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
            const user = usersRes.value.find((u) => u.id == item.senderId);
            const message = {
              id: item.id,
              content: item.text,
              createdAt: item.createdAt,
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
              if (item.createdAt < otherMember.lastSeenMessage.createdAt) {
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
