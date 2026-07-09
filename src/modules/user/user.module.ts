import { AuthModule } from '@auth/auth.module';
import { AuthIntegrationPort } from '@user/application/ports/auth-integration.port';
import { AuthIntegrationAdapter } from '@user/infrastructure/adapters/auth-integration.adapter';
import { UserHttpGuard } from '@user/presentation/http/guards/user-http.guard';
import { UserHttpController } from '@user/presentation/http/user-http.controller';
import { Module, forwardRef } from '@nestjs/common';
import { UserDatabaseModule } from '@user/infrastructure/postgres/user-database.module';
import { UserService } from '@user/application/services/user.service';

@Module({
  imports: [UserDatabaseModule, forwardRef(() => AuthModule)],
  controllers: [UserHttpController],
  providers: [
    UserService,
    UserHttpGuard,
    { provide: AuthIntegrationPort, useClass: AuthIntegrationAdapter },
  ],
  exports: [UserService],
})
export class UserModule {}
