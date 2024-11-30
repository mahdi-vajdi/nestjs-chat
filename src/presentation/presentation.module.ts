import { Module } from '@nestjs/common';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ConversationGateway } from '@presentation/ws/gateways/conversation.gateway';
import { ApplicationModule } from '@application/application.module';
import { AuthModule } from '@presentation/auth/auth.module';
import { AuthModule as CoreAuthModule } from '@shared/auth/auth.module';

@Module({
  imports: [ApplicationModule, CoreAuthModule, AuthModule],
  controllers: [AuthHttpController],
  providers: [ConversationGateway],
})
export class PresentationModule {}
