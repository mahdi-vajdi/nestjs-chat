import { Module } from '@nestjs/common';
import { UserModule } from '@shared/user/user.module';
import { AuthService } from '@application/auth/auth.service';
import { AuthModule } from '@shared/auth/auth.module';

@Module({
  imports: [UserModule, AuthModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class ApplicationModule {}
