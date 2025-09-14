import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './postgres/entities/user.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserPostgresService } from './postgres/services/user-postgres.service';
import { USER_DATABASE_PROVIDER } from '@user/database/providers/user-database.provider';
import { UserBlock } from '@user/database/postgres/entities/user-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBlock], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: USER_DATABASE_PROVIDER,
      useClass: UserPostgresService,
    },
  ],
  exports: [USER_DATABASE_PROVIDER],
})
export class UserDatabaseModule {}
