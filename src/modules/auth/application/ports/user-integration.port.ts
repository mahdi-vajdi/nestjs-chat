export interface AuthUser {
  id: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export abstract class UserIntegrationPort {
  abstract createUser(data: any): Promise<AuthUser>;
  abstract validatePassword(
    property: string,
    password: string,
  ): Promise<AuthUser>;
}
