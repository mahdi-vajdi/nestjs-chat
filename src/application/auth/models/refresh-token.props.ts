import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';

export interface RefreshTokenProps {
  identifier: string;
  token: string;
  userId: string;
}

export interface RefreshTokenEntity
  extends RefreshTokenProps,
    IdentifiableEntity,
    TimestampedEntity,
    SoftDeletableEntity {}
