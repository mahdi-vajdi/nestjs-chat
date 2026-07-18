import { UserRole } from '@user/domain/enums/user-role.enum';

export class UserReadDto {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly role: UserRole,
    public readonly firstName: string | null,
    public readonly lastName: string | null,
    public readonly avatar: string | null,
    public readonly createdAt: Date,
    public readonly password?: string, // Only included for internal validation queries
  ) {}
}
