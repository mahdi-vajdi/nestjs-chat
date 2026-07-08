import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserPostgresRepository } from './repositories/user-postgres.repository';
import { USER_REPOSITORY_PORT } from '@user/application/ports/user-repository.port';
import { UserBlock } from '@user/infrastructure/postgres/entities/user-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBlock], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserPostgresRepository,
    },
  ],
  exports: [USER_REPOSITORY_PORT],
})
export class UserDatabaseModule {}
