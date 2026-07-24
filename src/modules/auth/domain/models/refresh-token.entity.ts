import { AggregateRoot } from '@common/domain/aggregate-root';
import { v7 as uuidv7 } from 'uuid';

export class RefreshTokenEntity extends AggregateRoot<string> {
  private _userId: string;
  private _token: string; // The hashed token
  private _identifier: string; // The JTI
  private _deletedAt: Date | null;

  constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    userId: string,
    token: string,
    identifier: string,
    deletedAt?: Date | null,
  ) {
    super(id, createdAt, updatedAt);

    if (!userId) throw new Error('Refresh token must have a user ID');
    if (!token) throw new Error('Refresh token must have a token hash');
    if (!identifier)
      throw new Error('Refresh token must have an identifier (JTI)');

    this._userId = userId;
    this._token = token;
    this._identifier = identifier;
    this._deletedAt = deletedAt ?? null;
  }

  public static create(
    userId: string,
    tokenHash: string,
    identifier: string,
  ): RefreshTokenEntity {
    const id = uuidv7();
    return new RefreshTokenEntity(
      id,
      new Date(),
      new Date(),
      userId,
      tokenHash,
      identifier,
    );
  }

  // Getters
  get userId(): string {
    return this._userId;
  }

  get token(): string {
    return this._token;
  }

  get identifier(): string {
    return this._identifier;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // Mutations
  public revoke(): void {
    this._deletedAt = new Date();
    this.updatedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = null;
    this.updatedAt = new Date();
  }
}
