import { Module } from '@nestjs/common';
import { USER_DATABASE_PROVIDER } from '../../domain/interfaces/user-database.provider';
import { UserPostgresService } from './services/user-postgres.service';
import { DatabaseModule } from '@shared/database/postgres/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: USER_DATABASE_PROVIDER,
      useClass: UserPostgresService,
    },
  ],
  exports: [USER_DATABASE_PROVIDER],
})
export class UserDatabaseModule {}
