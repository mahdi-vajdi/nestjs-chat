import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthPostgresRepository } from './repositories/auth-postgres.repository';
import { AUTH_REPOSITORY_PORT } from '@auth/application/ports/auth-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: AUTH_REPOSITORY_PORT,
      useClass: AuthPostgresRepository,
    },
  ],
  exports: [AUTH_REPOSITORY_PORT],
})
export class AuthDatabaseModule {}
