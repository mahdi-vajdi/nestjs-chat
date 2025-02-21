import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '@application/auth/services/auth.service';
import { AuthDatabaseModule } from '@application/auth/database/auth-database.module';

@Module({
  imports: [
    ConfigModule,
    AuthDatabaseModule,
    JwtModule.register({
      signOptions: {
        algorithm: 'RS256',
        expiresIn: '1h',
        issuer: 'chatterbox',
        audience: 'chatterbox-client',
      },
      verifyOptions: {
        algorithms: ['RS256'],
        issuer: 'chatterbox',
        audience: 'chatterbox-client',
        clockTolerance: 15,
      },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
