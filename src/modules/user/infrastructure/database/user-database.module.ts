import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { UserPostgresRepository } from '@user/infrastructure/database/repositories/user-postgres.repository';
import { UserPostgresReadRepository } from '@user/infrastructure/database/repositories/user-postgres-read.repository';
import { UserRepositoryPort } from '@user/application/ports/user-repository.port';
import { UserReadRepositoryPort } from '@user/application/ports/user-read-repository.port';
import { UserBlock } from '@user/infrastructure/database/entities/user-block.entity';
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
