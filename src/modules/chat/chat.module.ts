import { AuthModule } from '@modules/auth/auth.module';
import { AuthIntegrationPort } from '@modules/chat/application/ports/auth-integration.port';
import { AuthIntegrationAdapter } from '@modules/chat/infrastructure/adapters/auth-integration.adapter';
import { ChatWsGuard } from '@modules/chat/presentation/ws/guards/chat-ws.guard';
import { ChatWsGateway } from '@modules/chat/presentation/ws/chat-ws.gateway';
import { Module } from '@nestjs/common';
import { ChatDatabaseModule } from '@modules/chat/infrastructure/database/chat-database.module';
import { UserModule } from '@modules/user/user.module';
import { UserIntegrationPort } from '@modules/chat/application/ports/user-integration.port';
import { UserIntegrationAdapter } from '@modules/chat/infrastructure/adapters/user-integration.adapter';
import { CqrsModule } from '@nestjs/cqrs';

import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';
import { EventHandlers } from './presentation/ws/events/handlers';

@Module({
  imports: [CqrsModule, ChatDatabaseModule, UserModule, AuthModule],
  providers: [
    ChatWsGateway,
    ChatWsGuard,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    { provide: AuthIntegrationPort, useClass: AuthIntegrationAdapter },
    {
      provide: UserIntegrationPort,
      useClass: UserIntegrationAdapter,
    },
  ],
  exports: [],
})
export class ChatModule {}
