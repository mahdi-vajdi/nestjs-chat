import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@shared/user/domain/entities/user.model';

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  static fromDomain(user: User): UserEntity {
    if (!user) return null;

    const userEntity = new UserEntity();

    userEntity.id = user.id;
    userEntity.email = user.email;
    userEntity.username = user.username;
    userEntity.password = user.password;
    userEntity.firstName = user.firstName;
    userEntity.lastName = user.lastName;
    userEntity.createdAt = user.createdAt;
    userEntity.updatedAt = user.updatedAt;
    userEntity.deletedAt = user.deletedAt;

    return userEntity;
  }

  static toDomain(userEntity: UserEntity): User {
    if (!userEntity) return null;

    return new User({
      id: userEntity.id,
      email: userEntity.email,
      username: userEntity.username,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      createdAt: userEntity.createdAt,
      updatedAt: userEntity.updatedAt,
      deletedAt: userEntity.deletedAt,
    });
  }
}
