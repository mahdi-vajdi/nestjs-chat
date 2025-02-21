import { Module } from '@nestjs/common';
import { UserDatabaseModule } from '@user/database/user-database.module';
import { UserService } from '@user/services/user.service';

@Module({
  imports: [UserDatabaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
