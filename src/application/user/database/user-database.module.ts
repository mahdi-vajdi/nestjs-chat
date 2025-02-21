import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './postgres/entities/user.entity';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserPostgresService } from './postgres/services/user-postgres.service';
import { USER_DATABASE_PROVIDER } from '@user/database/providers/user-database.provider';

@Module({
  imports: [
    DatabaseModule.register(DatabaseType.POSTGRES),
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
