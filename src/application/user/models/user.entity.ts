import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { UserRole } from '@user/enums/user-role.enum';

export class User
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  id: string;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date;

  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;

  private constructor(properties: Partial<User>) {
    Object.assign(this, properties);
  }

  static create(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole,
  ) {
    return new User({
      email,
      username,
      password,
      firstName,
      lastName,
      role,
    });
  }
}
