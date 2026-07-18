import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserPostgresRepository } from '@user/infrastructure/postgres/repositories/user-postgres.repository';
import { UserPostgresReadRepository } from '@user/infrastructure/postgres/repositories/user-postgres-read.repository';
import { USER_REPOSITORY_PORT } from '@user/application/ports/user-repository.port';
import { USER_READ_REPOSITORY_PORT } from '@user/application/ports/user-read-repository.port';
import { UserBlock } from '@user/infrastructure/postgres/entities/user-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBlock], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserPostgresRepository,
    },
    {
      provide: USER_READ_REPOSITORY_PORT,
      useClass: UserPostgresReadRepository,
    },
  ],
  exports: [USER_REPOSITORY_PORT, USER_READ_REPOSITORY_PORT],
})
export class UserDatabaseModule {}
