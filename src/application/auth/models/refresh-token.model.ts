import { IIdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { IDatatableEntity } from '@common/entities/datable-entity.interface';
import { IDeletableEntity } from '@common/entities/deletable-entity.interface';

export interface IRefreshToken {
  readonly userId: string;
  readonly token: string;
  readonly identifier: string;
}

export interface IRefreshTokenEntity
  extends IRefreshToken,
    IIdentifiableEntity,
    IDatatableEntity,
    IDeletableEntity {}
