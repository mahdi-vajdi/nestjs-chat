import { AuthModule } from '@modules/auth/auth.module';
import { AuthIntegrationPort } from '@modules/user/application/ports/auth-integration.port';
import { AuthIntegrationAdapter } from '@modules/user/infrastructure/adapters/auth-integration.adapter';
import { UserHttpGuard } from '@modules/user/presentation/http/guards/user-http.guard';
import { UserHttpController } from '@modules/user/presentation/http/user-http.controller';
import { Module } from '@nestjs/common';
import { UserDatabaseModule } from '@modules/user/infrastructure/database/user-database.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './application/commands';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [UserDatabaseModule, AuthModule, CqrsModule],
  controllers: [UserHttpController],
  providers: [
    UserHttpGuard,
    { provide: AuthIntegrationPort, useClass: AuthIntegrationAdapter },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class UserModule {}
