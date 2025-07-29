import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';

export class RefreshToken
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  identifier: string;
  token: string;
  userId: string;

  private constructor(parameters: Partial<RefreshToken>) {
    Object.assign(this, parameters);
  }

  static create(
    identifier: string,
    token: string,
    userId: string,
  ): RefreshToken {
    return new RefreshToken({
      identifier,
      token,
      userId,
    });
  }
}
