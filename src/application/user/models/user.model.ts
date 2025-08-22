import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { UserRole } from '@user/enums/user-role.enum';

export class UserProps {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar: string | null;
}

export interface UserEntity
  extends UserProps,
    IdentifiableEntity,
    TimestampedEntity,
    SoftDeletableEntity {}
