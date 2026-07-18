import { AuthModule } from '@auth/auth.module';
import { AuthIntegrationPort } from '@chat/application/ports/auth-integration.port';
import { AuthIntegrationAdapter } from '@chat/infrastructure/adapters/auth-integration.adapter';
import { ChatWsGuard } from '@chat/presentation/ws/guards/chat-ws.guard';
import { ChatWsGateway } from '@chat/presentation/ws/chat-ws.gateway';
import { Module } from '@nestjs/common';
import { ChatDatabaseModule } from '@chat/infrastructure/postgres/chat-database.module';
import { UserModule } from '@user/user.module';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { UserIntegrationAdapter } from '@chat/infrastructure/adapters/user-integration.adapter';
import { CqrsModule } from '@nestjs/cqrs';

// Handlers
import { CreateDirectConversationHandler } from './application/commands/create-direct-conversation/create-direct-conversation.handler';
import { CreateMessageHandler } from './application/commands/create-message/create-message.handler';
import { DeleteConversationHandler } from './application/commands/delete-conversation/delete-conversation.handler';
import { MarkConversationAsReadCommandHandler } from './application/commands/mark-conversation-as-read/mark-conversation-as-read.handler';
import { GetUserConversationListHandler } from './application/queries/get-user-conversation-list/get-user-conversation-list.handler';
import { GetUserConversationIdsHandler } from './application/queries/get-user-conversation-ids/get-user-conversation-ids.handler';
import { GetUserConversationHandler } from './application/queries/get-user-conversation/get-user-conversation.handler';
import { GetUserConversationMessageListHandler } from './application/queries/get-user-conversation-message-list/get-user-conversation-message-list.handler';

const CommandHandlers = [
  CreateDirectConversationHandler,
  CreateMessageHandler,
  DeleteConversationHandler,
  MarkConversationAsReadCommandHandler,
];

const QueryHandlers = [
  GetUserConversationListHandler,
  GetUserConversationIdsHandler,
  GetUserConversationHandler,
  GetUserConversationMessageListHandler,
];

@Module({
  imports: [CqrsModule, ChatDatabaseModule, UserModule, AuthModule],
  providers: [
    ChatWsGateway,
    ChatWsGuard,
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: AuthIntegrationPort, useClass: AuthIntegrationAdapter },
    {
      provide: UserIntegrationPort,
      useClass: UserIntegrationAdapter,
    },
  ],
  exports: [],
})
export class ChatModule {}
