import { Module } from '@nestjs/common';
import { UserDatabaseModule } from '../../infrastructure/user/database/database.module';
import { UserService } from './services/user.service';

@Module({
  imports: [UserDatabaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
