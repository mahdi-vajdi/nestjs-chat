import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IDeletableEntity } from '@common/entities/deletable-entity.interface';

export interface IRefreshToken {
  readonly userId: string;
  readonly token: string;
  readonly identifier: string;
}

export class RefreshToken
  implements
    IRefreshToken,
    IIdentifiableEntity,
    IDatatableEntity,
    IDeletableEntity
{
  id: string;
  userId: string;
  token: string;
  identifier: string;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(init: Partial<RefreshToken>) {
    Object.assign(this, init);
  }

  static create(iRefreshToken: IRefreshToken): RefreshToken {
    return new RefreshToken(iRefreshToken);
  }
}
