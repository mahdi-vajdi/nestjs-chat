import { AuthModule } from '@auth/auth.module';
import { AuthIntegrationPort } from '@user/application/ports/auth-integration.port';
import { AuthIntegrationAdapter } from '@user/infrastructure/adapters/auth-integration.adapter';
import { UserHttpGuard } from '@user/presentation/http/guards/user-http.guard';
import { UserHttpController } from '@user/presentation/http/user-http.controller';
import { Module } from '@nestjs/common';
import { UserDatabaseModule } from '@user/infrastructure/database/user-database.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from '@user/application/commands/create-user/create-user.handler';
import { BlockUserHandler } from '@user/application/commands/block-user/block-user.handler';
import { UnblockUserHandler } from '@user/application/commands/unblock-user/unblock-user.handler';
import { GetUserIdsByNameOrUsernameHandler } from '@user/application/queries/get-user-ids-by-name-or-username/get-user-ids-by-name-or-username.handler';
import { GetUserByIdHandler } from '@user/application/queries/get-user-by-id/get-user-by-id.handler';
import { GetUsersByIdsHandler } from '@user/application/queries/get-users-by-ids/get-users-by-ids.handler';
import { ValidatePasswordHandler } from '@user/application/queries/validate-password/validate-password.handler';
import { GetBlockStatusHandler } from '@user/application/queries/get-block-status/get-block-status.handler';
import { GetBlockedUsersIdsHandler } from '@user/application/queries/get-blocked-users-ids/get-blocked-users-ids.handler';

@Module({
  imports: [UserDatabaseModule, AuthModule, CqrsModule],
  controllers: [UserHttpController],
  providers: [
    UserHttpGuard,
    { provide: AuthIntegrationPort, useClass: AuthIntegrationAdapter },
    CreateUserHandler,
    BlockUserHandler,
    UnblockUserHandler,
    GetUserIdsByNameOrUsernameHandler,
    GetUserByIdHandler,
    GetUsersByIdsHandler,
    ValidatePasswordHandler,
    GetBlockStatusHandler,
    GetBlockedUsersIdsHandler,
  ],
})
export class UserModule {}
