import { Module } from '@nestjs/common';
import { UserModule } from '@user/user.module';
import { AuthService } from '@application/auth/auth.service';

@Module({
  imports: [UserModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class ApplicationModule {}
