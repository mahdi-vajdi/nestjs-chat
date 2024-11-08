import { Module } from '@nestjs/common';
import { AuthDatabaseModule } from './infrastructure/database/auth-database.module';
import { AuthService } from './application/services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

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
