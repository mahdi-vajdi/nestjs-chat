import { UserIntegrationPort } from '@auth/application/ports/user-integration.port';
import { UserIntegrationAdapter } from '@auth/infrastructure/adapters/user-integration.adapter';
import { AuthHttpController } from '@auth/presentation/http/auth-http.controller';
import { AuthHttpGuard } from '@auth/presentation/guards/auth-http.guard';
import { AuthWsGuard } from '@auth/presentation/guards/auth-ws.guard';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { SignupHandler } from '@auth/application/commands/signup/signup.handler';
import { SigninHandler } from '@auth/application/commands/signin/signin.handler';
import { RefreshTokensHandler } from '@auth/application/commands/refresh-tokens/refresh-tokens.handler';
import { VerifyAccessTokenHandler } from '@auth/application/queries/verify-access-token/verify-access-token.handler';
import { TokenService } from '@auth/application/services/token.service';
import { AuthDatabaseModule } from '@auth/infrastructure/database/auth-database.module';

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    AuthDatabaseModule,
    JwtModule.register({
      signOptions: {
        algorithm: 'RS256',
        issuer: 'nestjs-chat',
        audience: 'nestjs-chat-client',
      },
      verifyOptions: {
        algorithms: ['RS256'],
        issuer: 'nestjs-chat',
        audience: 'nestjs-chat-client',
        clockTolerance: 15,
      },
    }),
  ],
  controllers: [AuthHttpController],
  providers: [
    TokenService,
    SignupHandler,
    SigninHandler,
    RefreshTokensHandler,
    VerifyAccessTokenHandler,
    AuthHttpGuard,
    AuthWsGuard,
    { provide: UserIntegrationPort, useClass: UserIntegrationAdapter },
  ],
  exports: [AuthHttpGuard, AuthWsGuard],
})
export class AuthModule {}
