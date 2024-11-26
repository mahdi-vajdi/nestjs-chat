import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IDeletableEntity } from '@common/entities/deletable-entity.interface';
import { UserRole } from '@shared/user/domain/enums/user-role.enum';

export class IUser {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export class User
  implements IUser, IIdentifiableEntity, IDatatableEntity, IDeletableEntity
{
  id: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  constructor(init: Partial<User>) {
    Object.assign(this, init);
  }

  static create(iUser: IUser): User {
    return new User(iUser);
  }
}
