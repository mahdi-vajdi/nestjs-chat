export abstract class Entity<TId> {
  private _updatedAt: Date;

  protected constructor(
    public readonly id: TId,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    this._updatedAt = updatedAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  protected set updatedAt(value: Date) {
    this._updatedAt = value;
  }

  public equals(object?: Entity<TId>): boolean {
    if (object == null) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this.id === object.id;
  }
}
