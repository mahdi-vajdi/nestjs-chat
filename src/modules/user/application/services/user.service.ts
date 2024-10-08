import { Inject, Injectable } from '@nestjs/common';
import {
  IUserDatabaseProvider,
  USER_DATABASE_PROVIDER,
} from '../../domain/interfaces/user-database.provider';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_DATABASE_PROVIDER) userDatabaseProvider: IUserDatabaseProvider,
  ) {}
}
