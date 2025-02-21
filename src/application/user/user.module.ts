import { Module } from '@nestjs/common';
import { UserService } from '@application/user/services/user.service';
import { UserDatabaseModule } from '@application/user/database/user-database.module';

@Module({
  imports: [UserDatabaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
