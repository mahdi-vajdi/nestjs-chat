import { Module } from '@nestjs/common';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';
import { ApplicationModule } from '@application/application.module';

@Module({
  imports: [ApplicationModule],
  controllers: [AuthHttpController],
})
export class PresentationModule {}
