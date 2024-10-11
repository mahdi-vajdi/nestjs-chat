import { Injectable } from '@nestjs/common';
import { IUserDatabaseProvider } from '@domain/user/interfaces/user-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { DatabaseType } from '@shared/database/database-type.enum';
import { Repository } from 'typeorm';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(UserEntity, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
}
