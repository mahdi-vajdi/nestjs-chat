import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './postgres/entities/user.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserPostgresRepository } from '@modules/user/infrastructure/database/postgres/repositories/user-postgres.repository';
import { UserPostgresReadRepository } from '@modules/user/infrastructure/database/postgres/repositories/user-postgres-read.repository';
import { UserRepositoryPort } from '@modules/user/application/ports/user-repository.port';
import { UserReadRepositoryPort } from '@modules/user/application/ports/user-read-repository.port';
import { UserBlock } from '@modules/user/infrastructure/database/postgres/entities/user-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserBlock], DatabaseType.POSTGRES)],
  providers: [
    {
      provide: UserRepositoryPort,
      useClass: UserPostgresRepository,
    },
    {
      provide: UserReadRepositoryPort,
      useClass: UserPostgresReadRepository,
    },
  ],
  exports: [UserRepositoryPort, UserReadRepositoryPort],
})
export class UserDatabaseModule {}
