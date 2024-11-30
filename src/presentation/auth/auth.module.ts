import { Module } from '@nestjs/common';
import { AuthModule as CoreAuthModule } from '@shared/auth/auth.module';
import { AuthHttpGuard } from '@presentation/auth/guards/auth-http.guard';
import { AuthWsGuard } from '@presentation/auth/guards/auth-ws.guard';

@Module({
  imports: [CoreAuthModule],
  providers: [AuthHttpGuard, AuthWsGuard],
  exports: [AuthHttpGuard, AuthWsGuard],
})
export class AuthModule {}
