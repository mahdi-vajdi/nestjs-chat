import { Module } from '@nestjs/common';
import { UserModule } from '../application/user/user.module';
import { AuthHttpController } from './http/controllers/auth/auth-http.controller';

@Module({
  imports: [UserModule],
  controllers: [AuthHttpController],
})
export class PresentationModule {}
