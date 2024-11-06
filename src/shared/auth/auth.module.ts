import { Module } from '@nestjs/common';
import { AuthDatabaseModule } from './infrastructure/database/auth-database.module';
import { AuthService } from './application/services/auth.service';

@Module({
  imports: [AuthDatabaseModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
