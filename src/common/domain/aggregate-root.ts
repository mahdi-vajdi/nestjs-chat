import { AggregateRoot as CqrsAggregateRoot } from '@nestjs/cqrs';

export abstract class AggregateRoot<TId> extends CqrsAggregateRoot {
  protected constructor(
    public readonly id: TId,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {
    super();
  }

  public equals(object?: AggregateRoot<TId>): boolean {
    if (object == null) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof AggregateRoot)) {
      return false;
    }

    return this.id === object.id;
  }
}
