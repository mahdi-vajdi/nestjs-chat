import { Module } from '@nestjs/common';
import { USER_DATABASE_PROVIDER } from '@domain/user/interfaces/user-database.provider';
import { UserPostgresService } from './postgres/services/user-postgres.service';
import { DatabaseModule } from '@shared/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './postgres/models/user.entity';
import { DatabaseType } from '@shared/database/database-type.enum';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity], DatabaseType.POSTGRES),
  ],
  providers: [
    {
      provide: USER_DATABASE_PROVIDER,
      useClass: UserPostgresService,
    },
  ],
  exports: [USER_DATABASE_PROVIDER],
})
export class UserDatabaseModule {}
