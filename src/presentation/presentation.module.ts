import { Module } from '@nestjs/common';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ConversationGateway } from '@presentation/ws/gateways/conversation.gateway';
import { AuthHttpGuard } from '@presentation/guards/auth-http.guard';
import { AuthWsGuard } from '@presentation/guards/auth-ws.guard';
import { AuthModule } from '@auth/auth.module';
import { UserModule } from '@user/user.module';
import { ChatModule } from '@chat/chat.module';

@Module({
  imports: [AuthModule, UserModule, ChatModule],
  controllers: [AuthHttpController],
  providers: [
    // Websocket gateways
    ConversationGateway,
    // Guards
    AuthHttpGuard,
    AuthWsGuard,
  ],
})
export class PresentationModule {}
