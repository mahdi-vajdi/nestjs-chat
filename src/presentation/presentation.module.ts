import { Module } from '@nestjs/common';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ConversationGateway } from '@presentation/ws/gateways/conversation.gateway';
import { AuthModule } from '@application/auth/auth.module';
import { AuthHttpGuard } from '@presentation/guards/auth-http.guard';
import { AuthWsGuard } from '@presentation/guards/auth-ws.guard';
import { UserModule } from '@application/user/user.module';

@Module({
  imports: [AuthModule, UserModule],
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
