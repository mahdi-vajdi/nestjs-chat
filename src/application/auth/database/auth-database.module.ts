import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './postgres/entities/refresh-token.entity';
import { AuthPostgresService } from './postgres/services/auth-postgres.service';
import { AUTH_DATABASE_PROVIDER } from '@auth/database/providers/auth-database.provider';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: AUTH_DATABASE_PROVIDER,
      useClass: AuthPostgresService,
    },
  ],
  exports: [AUTH_DATABASE_PROVIDER],
})
export class AuthDatabaseModule {}
