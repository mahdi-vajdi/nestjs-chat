import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IDeletableEntity } from '@common/entities/deletable-entity.interface';
import { UserRole } from '@user/enums/user-role.enum';

export class IUser {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface IUserEntity
  extends IUser,
    IIdentifiableEntity,
    IDatatableEntity,
    IDeletableEntity {}
