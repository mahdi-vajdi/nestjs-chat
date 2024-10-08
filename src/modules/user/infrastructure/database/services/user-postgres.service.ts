import { Injectable } from '@nestjs/common';
import { IUserDatabaseProvider } from '../../../domain/interfaces/user-database.provider';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../models/user.entity';
import { DatabaseType } from '../../../../../shared/database/database-type.enum';
import { Repository } from 'typeorm';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(UserEntity, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
}
