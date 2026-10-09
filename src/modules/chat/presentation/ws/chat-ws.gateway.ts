import { CreateDirectConversationCommand } from '@modules/chat/application/commands/create-direct-conversation/create-direct-conversation.command';
import { CreateMessageCommand } from '@modules/chat/application/commands/create-message/create-message.command';
import { DeleteConversationCommand } from '@modules/chat/application/commands/delete-conversation/delete-conversation.command';
import { GetUserConversationListQuery } from '@modules/chat/application/queries/get-user-conversation-list/get-user-conversation-list.query';
import { GetUserConversationQuery } from '@modules/chat/application/queries/get-user-conversation/get-user-conversation.query';
import { GetUserConversationMessageListQuery } from '@modules/chat/application/queries/get-user-conversation-message-list/get-user-conversation-message-list.query';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatWsGuard } from '@modules/chat/presentation/ws/guards/chat-ws.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  GetUserConversationListRequest,
  UserConversationListItem,
} from '@modules/chat/presentation/ws/dtos/get-user-conversation-list.dto';
import { PaginationHelper } from '@common/pagination/pagination.helper';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import { CurrentUserId } from '@common/decorators/current-user-id.decorator';
import { ConversationType } from '@modules/chat/domain/enums/conversation-type.enum';
import { CreateConversationRequest } from '@modules/chat/presentation/ws/dtos/create-conversation.dto';
import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';
import { BaseWsGateway } from '@common/websocket/base-ws.gateway';
import { ConversationCreatedEvent } from '@modules/chat/presentation/ws/events/conversation-created.event';
import { CreateMessageRequest } from '@modules/chat/presentation/ws/dtos/create-message.dto';
import { MarkConversationAsReadCommand } from '@modules/chat/application/commands/mark-conversation-as-read/mark-conversation-as-read.command';
import { EditMessageCommand } from '@modules/chat/application/commands/edit-message/edit-message.command';
import { DeleteMessageCommand } from '@modules/chat/application/commands/delete-message/delete-message.command';
import {
  EditMessageRequest,
  EditMessageResponse,
} from '@modules/chat/presentation/ws/dtos/edit-message.dto';
import {
  DeleteMessageRequest,
  DeleteMessageResponse,
} from '@modules/chat/presentation/ws/dtos/delete-message.dto';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { GetConversationMessageListRequest } from '@modules/chat/presentation/ws/dtos/get-conversation-message-list.dto';
import { MessageSeenEvent } from '@modules/chat/presentation/ws/events/message-seen.event';
import { MarkMessageSeenRequest } from '@modules/chat/presentation/ws/dtos/mark-message-seen.dto';
import { GlobalWsExceptionFilter } from '@common/websocket/filters/global-ws-exception.filter';

@UseGuards(ChatWsGuard)
@UseFilters(new GlobalWsExceptionFilter())
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

    try {
      const authPayload = await client.data['authPromise'];

      const userEventsRoom = `user-${authPayload.sub}`;
      this.logger.debug(
        `Joining user ${authPayload.sub} to room ${userEventsRoom}`,
      );
      client.join(userEventsRoom);

      this.logger.log(`Client authorized: ${authPayload.sub}`);
      client.emit('ready');
    } catch (e) {
      this.logger.debug(
        `Error during connection: ${(e as Error).message}. disconnecting...`,
      );
      client.emit('error.client', (e as Error).message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const authUser = client.data?.user;
    if (authUser) {
      this.logger.log(`Client disconnected: ${authUser}`);
    } else {
      this.logger.debug(`Unknown client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('conversation.create')
  async createDirectConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateConversationRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<any> {
    const [currentUser, targetUser] = await Promise.all([
      this.userIntegrationPort.getUserById(authUserId),
      this.userIntegrationPort.getUserById(data.targetUserId),
    ]);

    const blockStatus = await this.userIntegrationPort.getBlockStatus(
      authUserId,
      targetUser.id,
    );
    if (blockStatus.isBlocker) {
      throw new WsException('You have blocked this user.');
    }

    const createConversation = await this.commandBus.execute(
      new CreateDirectConversationCommand(currentUser.id, data.targetUserId),
    );

    let createMessage;
    try {
      createMessage = await this.commandBus.execute(
        new CreateMessageCommand(
          data.content,
          MessageType.TEXT,
          currentUser.id,
          createConversation.id,
          blockStatus.isBlocked ? [targetUser.id] : [],
        ),
      );
    } catch (e) {
      await this.commandBus.execute(
        new DeleteConversationCommand(createConversation.id),
      );
      throw e;
    }

    if (!createMessage.deletedForUserIds.includes(targetUser.id)) {
      await this.broadcast(
        client,
        [`user-${targetUser.id}`],
        new ConversationCreatedEvent({
          id: createMessage.conversationId,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          avatar: currentUser.avatar,
          username: currentUser.username,
          notSeenCount: 1,
          lastMessage: {
            id: createMessage.id,
            content: createMessage.text,
            createdAt: createMessage.createdAt.toISOString(),
            seen: false,
            user: {
              id: currentUser.id,
              name: `${currentUser.firstName} ${currentUser.lastName}`,
            },
          },
        }),
      );
    }

    // Broadcast to sender's other devices/tabs
    await this.broadcast(
      client,
      [`user-${currentUser.id}`],
      new ConversationCreatedEvent({
        id: createMessage.conversationId,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        avatar: targetUser.avatar,
        username: targetUser.username,
        notSeenCount: 0,
        lastMessage: {
          id: createMessage.id,
          content: createMessage.text,
          createdAt: createMessage.createdAt.toISOString(),
          seen: true,
          user: {
            id: currentUser.id,
            name: `${currentUser.firstName} ${currentUser.lastName}`,
          },
        },
      }),
    );

    return {
      id: createConversation.id,
      username: createConversation.identifier,
      createdAt: createMessage.createdAt.toISOString(),
      avatar: createConversation.picture,
      name: `${targetUser.firstName} ${targetUser.lastName}`,
      chat: {
        id: createMessage.id,
        createdAt: createMessage.createdAt.toISOString(),
        seen: false,
        content: createMessage.text,
        user: {
          id: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
        },
      },
    };
  }

  @SubscribeMessage('conversation.list')
  async getUserConversationList(
    @MessageBody() data: GetUserConversationListRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<any> {
    const pagination = PaginationHelper.parse(data.page, data.pageSize);

    let filteredUserIds: string[] = [];
    if (data.filter) {
      filteredUserIds =
        await this.userIntegrationPort.getUserIdsByNameOrUsername(data.filter);
    }

    if (data.targetUserId) {
      filteredUserIds.push(data.targetUserId);
    }

    if (data.filter && filteredUserIds.length === 0) {
      return PaginationHelper.createResult([], 0, pagination);
    }

    const conversationList = await this.queryBus.execute(
      new GetUserConversationListQuery(authUserId, {
        pagination,
        filterUserIds: filteredUserIds.filter(
          (userId) => userId && userId !== authUserId,
        ),
        withLastMessage: true,
      }),
    );

    const conversationsUserIds = conversationList.data
      .map((c) => c.lastMessage?.senderId)
      .filter((id) => id != null);
    const allUsersInvolved = conversationList.data.flatMap((c) =>
      c.members.map((m) => m.userId),
    );
    allUsersInvolved.push(...conversationsUserIds);
    const uniqueUserIds = Array.from(new Set(allUsersInvolved)) as string[];

    const users = await this.userIntegrationPort.getUsersByIds(uniqueUserIds);

    return {
      meta: conversationList.meta,
      data: conversationList.data.map((item) => {
        const currentMember = item.members.find((m) => m.userId == authUserId);
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
            const otherUser = users.find((u) => u.id == otherMember.userId);
            if (otherUser) {
              conversation.title = `${otherUser.firstName} ${otherUser.lastName}`;
              conversation.identifier = otherUser.username;
              conversation.picture = otherUser.avatar;
            }
          }

          if (conversation.lastMessage) {
            const sender = users.find(
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
    };
  }

  @SubscribeMessage('conversation.message.send')
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<any> {
    const conversation = await this.queryBus.execute(
      new GetUserConversationQuery(data.conversationId, authUserId),
    );

    const targetMember = conversation.members.find(
      (member) => member.userId !== authUserId,
    );
    if (!targetMember) {
      throw new WsException('Conversation not found');
    }

    const [currentUser, targetUser, blockStatus] = await Promise.all([
      this.userIntegrationPort.getUserById(authUserId),
      this.userIntegrationPort.getUserById(targetMember.userId),
      this.userIntegrationPort.getBlockStatus(authUserId, targetMember.userId),
    ]);
    if (blockStatus.isBlocker) {
      throw new WsException(
        'You need to unblock the user before sending a message.',
      );
    }

    const createMessage = await this.commandBus.execute(
      new CreateMessageCommand(
        data.text,
        MessageType.TEXT,
        authUserId,
        conversation.id,
        blockStatus.isBlocked ? [targetUser.id] : [],
        data.replyToMessageId,
      ),
    );

    let replyTo = null;
    if (createMessage.replyToMessageId && createMessage.replyToMessage) {
      const parentMsg = createMessage.replyToMessage;
      const parentMember = conversation.members.find(
        (m: any) => m.id === parentMsg.senderId,
      );
      const parentUserId = parentMember ? parentMember.userId : null;
      let parentUser = null;
      if (parentUserId) {
        parentUser =
          parentUserId === currentUser.id
            ? currentUser
            : parentUserId === targetUser.id
              ? targetUser
              : await this.userIntegrationPort.getUserById(parentUserId);
      }

      replyTo = {
        id: parentMsg.id,
        content: parentMsg.deletedAt ? null : parentMsg.text,
        createdAt: parentMsg.createdAt.toISOString(),
        senderId: parentUserId || parentMsg.senderId,
        user: parentUser
          ? {
              id: parentUser.id,
              name: `${parentUser.firstName} ${parentUser.lastName}`,
            }
          : null,
      };
    }

    return {
      id: createMessage.id,
      createdAt: createMessage.createdAt.toISOString(),
      seen: false,
      user: {
        id: currentUser.id,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      content: createMessage.text,
      replyToMessageId: createMessage.replyToMessageId ?? null,
      replyTo,
    };
  }

  @SubscribeMessage('conversation.message.edit')
  async editMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: EditMessageRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<EditMessageResponse> {
    const conversation = await this.queryBus.execute(
      new GetUserConversationQuery(data.conversationId, authUserId),
    );

    const isMember = conversation.members.some((m) => m.userId === authUserId);
    if (!isMember) {
      throw new WsException('Conversation not found or access denied');
    }

    const editedMessage: MessageEntity = await this.commandBus.execute(
      new EditMessageCommand(
        data.messageId,
        data.conversationId,
        authUserId,
        data.text,
      ),
    );

    return {
      id: editedMessage.id,
      content: editedMessage.text,
      editedAt: (
        editedMessage.editedAt || editedMessage.updatedAt
      ).toISOString(),
    };
  }

  @SubscribeMessage('conversation.message.delete')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DeleteMessageRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<DeleteMessageResponse> {
    const conversation = await this.queryBus.execute(
      new GetUserConversationQuery(data.conversationId, authUserId),
    );

    const isMember = conversation.members.some((m) => m.userId === authUserId);
    if (!isMember) {
      throw new WsException('Conversation not found or access denied');
    }

    const deletedMessage: MessageEntity = await this.commandBus.execute(
      new DeleteMessageCommand(
        data.messageId,
        data.conversationId,
        authUserId,
        data.scope,
      ),
    );

    return {
      id: deletedMessage.id,
      conversationId: data.conversationId,
      scope: data.scope,
    };
  }

  @SubscribeMessage('conversation.message.list')
  async getConversationMessageList(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GetConversationMessageListRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<any> {
    const conversation = await this.queryBus.execute(
      new GetUserConversationQuery(data.conversationId, authUserId),
    );

    const pagination = PaginationHelper.parse(data.page, data.pageSize);

    const messageList = await this.queryBus.execute(
      new GetUserConversationMessageListQuery(
        data.conversationId,
        authUserId,
        pagination,
      ),
    );

    let userIds = messageList.data.map((message) => message.senderId);
    userIds.push(...conversation.members.map((member) => member.userId));
    for (const msg of messageList.data) {
      if (msg.replyTo?.senderId) {
        userIds.push(msg.replyTo.senderId);
      }
    }
    userIds = Array.from(new Set(userIds));

    const users = await this.userIntegrationPort.getUsersByIds(userIds);

    const blockedUserIds = await this.userIntegrationPort.getBlockedUsersIds(
      authUserId,
      users.map((user) => user.id),
    );

    return {
      id: conversation.id,
      name:
        conversation.type == ConversationType.DIRECT
          ? users.find((m) => m.id != authUserId)?.firstName
          : conversation.title,
      avatar:
        conversation.type == ConversationType.DIRECT
          ? users.find((m) => m.id != authUserId)?.avatar
          : conversation.title,
      username:
        conversation.type == ConversationType.DIRECT
          ? users.find((m) => m.id != authUserId)?.username
          : conversation.identifier,
      members: users
        .filter((user) => user.id != authUserId)
        .map((m) => ({
          id: m.id,
          avatar: m.avatar,
          username: m.username,
          name: m.firstName,
          isBlocked: blockedUserIds.includes(m.id),
        })),
      messages: {
        total: messageList.meta.total,
        page: messageList.meta.page,
        pageSize: messageList.meta.pageSize,
        list: messageList.data.map((item) => {
          const user = users.find((u) => u.id == item.senderId);
          let replyTo = null;
          if (item.replyTo) {
            const replyUser = users.find((u) => u.id == item.replyTo?.senderId);
            replyTo = {
              id: item.replyTo.id,
              content: item.replyTo.text,
              createdAt: item.replyTo.createdAt,
              senderId: item.replyTo.senderId,
              user: replyUser
                ? {
                    id: replyUser.id,
                    name: replyUser.firstName,
                  }
                : null,
            };
          }

          const message = {
            id: item.id,
            content: item.deletedAt ? null : item.text,
            createdAt: item.createdAt,
            editedAt: item.editedAt ?? null,
            deletedAt: item.deletedAt ?? null,
            seen: false,
            user: user
              ? {
                  id: user.id,
                  name: user.firstName,
                }
              : null,
            replyToMessageId: item.replyToMessageId ?? null,
            replyTo,
          };

          if (message.user?.id === authUserId) {
            const otherMember = conversation.members.find(
              (m) => m.userId !== authUserId,
            );
            if (
              otherMember?.lastSeenMessage?.createdAt &&
              item.createdAt <= otherMember.lastSeenMessage.createdAt
            ) {
              message.seen = true;
            }
          }

          return message;
        }),
      },
    };
  }

  @SubscribeMessage('conversation.message.markSeen')
  async markMessageAsSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MarkMessageSeenRequest,
    @CurrentUserId() authUserId: string,
  ): Promise<void> {
    const conversation = await this.queryBus.execute(
      new GetUserConversationQuery(data.conversationId, authUserId),
    );

    // Verify user is a member of the conversation
    const isMember = conversation.members.some((m) => m.userId === authUserId);
    if (!isMember) {
      throw new WsException('Conversation not found or access denied');
    }

    // Execute the command to update the read status in the DB
    await this.commandBus.execute(
      new MarkConversationAsReadCommand(
        conversation.id,
        authUserId,
        data.messageId,
      ),
    );

    // Broadcast the event to all members including sender's other devices
    const recipientRooms = conversation.members.map(
      (member) => `user-${member.userId}`,
    );

    await this.broadcast(
      client,
      recipientRooms,
      new MessageSeenEvent({
        conversationId: conversation.id,
        messageId: data.messageId,
      }),
    );
  }
}
