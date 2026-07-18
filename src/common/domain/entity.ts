export abstract class Entity<TId> {
  protected constructor(
    public readonly id: TId,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

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
