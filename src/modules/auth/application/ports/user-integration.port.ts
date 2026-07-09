import { Result } from '@common/result/result';

export interface AuthUser {
  id: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export abstract class UserIntegrationPort {
  abstract createUser(data: any): Promise<Result<AuthUser>>;
  abstract validatePassword(
    property: string,
    password: string,
  ): Promise<Result<AuthUser>>;
}
