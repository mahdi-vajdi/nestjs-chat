import { AggregateRoot } from '@common/domain/aggregate-root';
import { UserRole } from '@user/domain/enums/user-role.enum';
import { UserCreatedEvent } from '@user/domain/events/user-created.event';
import { UserBlockedEvent } from '@user/domain/events/user-blocked.event';
import { UserUnblockedEvent } from '@user/domain/events/user-unblocked.event';
import { v7 as uuidv7 } from 'uuid';

export class UserEntity extends AggregateRoot<string> {
  private _email: string;
  private _username: string;
  private _password: string;
  private _firstName: string;
  private _lastName: string;
  private _role: UserRole;
  private _avatar: string | null;
  private _blockedUsers: Partial<UserEntity>[];
  private _deletedAt: Date | null;

  constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    email: string,
    username: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    role?: UserRole,
    avatar?: string | null,
    blockedUsers?: Partial<UserEntity>[],
    deletedAt?: Date | null,
  ) {
    super(id, createdAt, updatedAt);

    if (!email || email.trim() === '') {
      throw new Error('User email cannot be empty');
    }
    if (!username || username.trim() === '') {
      throw new Error('User username cannot be empty');
    }

    this._email = email;
    this._username = username;
    this._password = password ?? '';
    this._firstName = firstName ?? '';
    this._lastName = lastName ?? '';
    this._role = role ?? UserRole.USER;
    this._avatar = avatar ?? null;
    this._blockedUsers = blockedUsers ?? [];
    this._deletedAt = deletedAt ?? null;
  }

  public static create(
    email: string,
    username: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    avatar?: string | null,
  ): UserEntity {
    const id = uuidv7();
    const user = new UserEntity(
      id,
      new Date(),
      new Date(),
      email,
      username,
      password,
      firstName,
      lastName,
      UserRole.USER,
      avatar,
    );

    // Apply event immediately after creation
    user.apply(new UserCreatedEvent(user.id, user.email, user.username));

    return user;
  }

  // Getters
  get email(): string {
    return this._email;
  }
  get username(): string {
    return this._username;
  }
  get password(): string {
    return this._password;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get role(): UserRole {
    return this._role;
  }
  get avatar(): string | null {
    return this._avatar;
  }
  get blockedUsers(): Partial<UserEntity>[] {
    return this._blockedUsers;
  }
  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // Domain Logic / Mutations
  public updateProfile(
    firstName: string,
    lastName: string,
    avatar: string | null,
  ) {
    this._firstName = firstName;
    this._lastName = lastName;
    this._avatar = avatar;
    this.updatedAt = new Date();
  }

  public changePassword(newPasswordHash: string) {
    this._password = newPasswordHash;
    this.updatedAt = new Date();
  }

  public blockUser(userToBlock: Partial<UserEntity>) {
    if (!this._blockedUsers.find((u) => u.id === userToBlock.id)) {
      this._blockedUsers.push(userToBlock);
      this.updatedAt = new Date();
      this.apply(new UserBlockedEvent(this.id, userToBlock.id!));
    }
  }

  public unblockUser(userToUnblock: Partial<UserEntity>) {
    const originalLength = this._blockedUsers.length;
    this._blockedUsers = this._blockedUsers.filter(
      (u) => u.id !== userToUnblock.id,
    );
    if (this._blockedUsers.length !== originalLength) {
      this.updatedAt = new Date();
      this.apply(new UserUnblockedEvent(this.id, userToUnblock.id!));
    }
  }

  public softDelete() {
    this._deletedAt = new Date();
    this.updatedAt = new Date();
  }
}
