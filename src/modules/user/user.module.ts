import { UserHttpController } from '@user/presentation/http/user-http.controller';
import { Module } from '@nestjs/common';
import { UserDatabaseModule } from '@user/infrastructure/postgres/user-database.module';
import { UserService } from '@user/application/services/user.service';

@Module({
  imports: [UserDatabaseModule],
  controllers: [UserHttpController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
