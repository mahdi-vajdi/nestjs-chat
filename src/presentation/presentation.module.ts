import { Module } from '@nestjs/common';
import { UserModule } from '../application/user/user.module';

@Module({
  imports: [UserModule],
})
export class PresentationModule {}
