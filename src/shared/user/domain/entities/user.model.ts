import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IDeletableEntity } from '@common/entities/deletable-entity.interface';

export class IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class User
  implements IUser, IIdentifiableEntity, IDatatableEntity, IDeletableEntity
{
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
