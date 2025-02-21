import { Module } from '@nestjs/common';
import { ChatDatabaseModule } from '@chat/database/chat-database.module';
import { ChatService } from '@chat/services/chat.service';

@Module({
  imports: [ChatDatabaseModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
