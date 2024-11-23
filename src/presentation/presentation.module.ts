import { Module } from '@nestjs/common';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ConversationGateway } from './websocket/gateways/conversation.gateway';
import { ApplicationModule } from '@application/application.module';

@Module({
  imports: [ApplicationModule],
  controllers: [AuthHttpController],
  providers: [ConversationGateway],
})
export class PresentationModule {}
