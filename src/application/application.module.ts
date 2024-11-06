import { Module } from '@nestjs/common';
import { UserModule } from '@user/user.module';
import { UserAuthService } from '@application/user-auth/user-auth.service';

@Module({
  imports: [UserModule],
  providers: [UserAuthService],
  exports: [UserAuthService],
})
export class ApplicationModule {}
