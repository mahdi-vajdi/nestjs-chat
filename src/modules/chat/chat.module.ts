import { ChatWsGateway } from '@chat/presentation/ws/chat-ws.gateway';
import { Module } from '@nestjs/common';
import { ChatDatabaseModule } from '@chat/infrastructure/postgres/chat-database.module';
import { ChatService } from '@chat/application/services/chat.service';

@Module({
  imports: [ChatDatabaseModule],
  providers: [ChatService, ChatWsGateway],
  exports: [ChatService],
})
export class ChatModule {}
