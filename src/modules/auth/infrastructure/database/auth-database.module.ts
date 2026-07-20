import { AuthRepositoryPort } from '@auth/application/ports/auth-repository.port';
import { Module } from '@nestjs/common';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthPostgresRepository } from './repositories/auth-postgres.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: AuthRepositoryPort,
      useClass: AuthPostgresRepository,
    },
  ],
  exports: [AuthRepositoryPort],
})
export class AuthDatabaseModule {}
