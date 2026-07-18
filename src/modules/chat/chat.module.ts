import { AuthModule } from '@auth/auth.module';
import { AuthIntegrationPort } from '@chat/application/ports/auth-integration.port';
import { AuthIntegrationAdapter } from '@chat/infrastructure/adapters/auth-integration.adapter';
import { ChatWsGuard } from '@chat/presentation/ws/guards/chat-ws.guard';
import { ChatWsGateway } from '@chat/presentation/ws/chat-ws.gateway';
import { Module } from '@nestjs/common';
import { ChatDatabaseModule } from '@chat/infrastructure/postgres/chat-database.module';
import { ChatService } from '@chat/application/services/chat.service';
import { UserModule } from '@user/user.module';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { UserIntegrationAdapter } from '@chat/infrastructure/adapters/user-integration.adapter';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule, ChatDatabaseModule, UserModule, AuthModule],
  providers: [
    ChatService,
    ChatWsGateway,
    ChatWsGuard,
    { provide: AuthIntegrationPort, useClass: AuthIntegrationAdapter },
    {
      provide: UserIntegrationPort,
      useClass: UserIntegrationAdapter,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
