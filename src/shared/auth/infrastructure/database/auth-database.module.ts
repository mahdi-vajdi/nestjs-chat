import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenEntity } from './postgres/entities/refresh-token.entity';
import { AUTH_DATABASE_PROVIDER } from '../../domain/interfaces/auth-database.provider';
import { AuthPostgresService } from './postgres/services/auth-postgres.service';

@Module({
  imports: [
    DatabaseModule.register(DatabaseType.POSTGRES),
    TypeOrmModule.forFeature([RefreshTokenEntity], DatabaseType.POSTGRES),
  ],
  providers: [
    {
      provide: AUTH_DATABASE_PROVIDER,
      useClass: AuthPostgresService,
    },
  ],
  exports: [AUTH_DATABASE_PROVIDER],
})
export class AuthDatabaseModule {}
