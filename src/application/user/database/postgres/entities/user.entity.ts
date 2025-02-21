import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@user/enums/user-role.enum';
import { IUser, IUserEntity } from '@user/models/user.model';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  @Index('UQ_USERS_EMAIL', { unique: true })
  email: string;

  @Column({ type: 'varchar', length: 40 })
  @Index('UQ_USERS_USERNAME', { unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  static fromDomain(user: IUser): UserEntity {
    if (!user) return null;

    const userEntity = new UserEntity();

    userEntity.email = user.email;
    userEntity.username = user.username;
    userEntity.password = user.password;
    userEntity.firstName = user.firstName;
    userEntity.lastName = user.lastName;
    userEntity.role = user.role;

    return userEntity;
  }

  static toDomain(userEntity: UserEntity): IUserEntity {
    if (!userEntity) return null;

    return {
      id: userEntity.id,
      role: userEntity.role,
      email: userEntity.email,
      username: userEntity.username,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      password: userEntity.password,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      deletedAt: userEntity.deletedAt,
    };
  }
}
