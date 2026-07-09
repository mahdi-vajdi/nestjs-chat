import { ChatWsGateway } from '@chat/presentation/ws/chat-ws.gateway';
import { Module } from '@nestjs/common';
import { ChatDatabaseModule } from '@chat/infrastructure/postgres/chat-database.module';
import { ChatService } from '@chat/application/services/chat.service';
import { UserModule } from '@user/user.module';
import { UserIntegrationPort } from '@chat/application/ports/user-integration.port';
import { UserIntegrationAdapter } from '@chat/infrastructure/adapters/user-integration.adapter';

@Module({
  imports: [ChatDatabaseModule, UserModule],
  providers: [
    ChatService,
    ChatWsGateway,
    {
      provide: UserIntegrationPort,
      useClass: UserIntegrationAdapter,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
