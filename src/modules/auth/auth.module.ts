import { UserIntegrationPort } from '@auth/application/ports/user-integration.port';
import { UserIntegrationAdapter } from '@auth/infrastructure/adapters/user-integration.adapter';
import { UserModule } from '@user/user.module';
import { AuthHttpController } from '@auth/presentation/http/auth-http.controller';
import { AuthHttpGuard } from '@auth/presentation/guards/auth-http.guard';
import { AuthWsGuard } from '@auth/presentation/guards/auth-ws.guard';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '@auth/application/services/auth.service';
import { AuthDatabaseModule } from '@auth/infrastructure/postgres/auth-database.module';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    AuthDatabaseModule,
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
    AuthService,
    AuthHttpGuard,
    AuthWsGuard,
    { provide: UserIntegrationPort, useClass: UserIntegrationAdapter },
  ],
  exports: [AuthService],
})
export class AuthModule {}
