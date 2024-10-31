import { Module } from '@nestjs/common';
import { UserModule } from '../application/user/user.module';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ConversationGateway } from './websocket/gateways/conversation.gateway';

@Module({
  imports: [UserModule],
  controllers: [AuthHttpController],
  providers: [ConversationGateway],
})
export class PresentationModule {}
