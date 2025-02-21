import { Module } from '@nestjs/common';
import { ChatService } from '@application/chat/services/chat.service';
import { ChatDatabaseModule } from '@application/chat/database/chat-database.module';

@Module({
  imports: [ChatDatabaseModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
