import { AggregateRoot as CqrsAggregateRoot } from '@nestjs/cqrs';

export abstract class AggregateRoot<TId> extends CqrsAggregateRoot {
  private _updatedAt: Date;

  protected constructor(
    public readonly id: TId,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    super();
    this._updatedAt = updatedAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  protected set updatedAt(value: Date) {
    this._updatedAt = value;
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
