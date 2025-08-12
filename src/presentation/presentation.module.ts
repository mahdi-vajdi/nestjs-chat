import { Module } from '@nestjs/common';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ChatWsGateway } from '@presentation/ws/gateways/chat-ws.gateway';
import { AuthHttpGuard } from '@presentation/http/guards/auth-http.guard';
import { AuthWsGuard } from '@presentation/ws/guards/auth-ws.guard';
import { AuthModule } from '@auth/auth.module';
import { UserModule } from '@user/user.module';
import { ChatModule } from '@chat/chat.module';

@Module({
  imports: [AuthModule, UserModule, ChatModule],
  controllers: [AuthHttpController],
  providers: [
    // Websocket gateways
    ChatWsGateway,
    // Guards
    AuthHttpGuard,
    AuthWsGuard,
  ],
})
export class PresentationModule {}
