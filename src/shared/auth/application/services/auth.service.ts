import { Injectable } from '@nestjs/common';
import { IAuthDatabaseProvider } from '../../domain/interfaces/auth-database.provider';

@Injectable()
export class AuthService {
  constructor(private readonly authDatabaseProvider: IAuthDatabaseProvider) {}
}
