import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@user/domain/entities/user.model';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  @Index('UQ_USERS_EMAIL', { unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  static fromDomain(user: User): UserEntity {
    if (!user) return null;

    const userEntity = new UserEntity();

    if (user.id) userEntity.id = Number(user.id);
    userEntity.email = user.email;
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

    const user = new User();

    user.id = String(userEntity.id);
    user.firstName = userEntity.firstName;
    user.lastName = userEntity.lastName;
    user.email = userEntity.email;
    user.createdAt = userEntity.createdAt;
    user.updatedAt = userEntity.updatedAt;
    user.deletedAt = userEntity.deletedAt;

    return user;
  }
}
