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
import { UserEntity, UserProps } from '@user/models/user.model';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  @Index('users_email_uniq', { unique: true })
  email: string;

  @Column({ type: 'varchar', length: 40 })
  @Index('users_username_uniq', { unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  static fromProps(props: UserProps): User {
    if (!props) return null;

    const userEntity = new User();

    userEntity.email = props.email;
    userEntity.username = props.username;
    userEntity.password = props.password;
    userEntity.first_name = props.firstName;
    userEntity.last_name = props.lastName;
    userEntity.role = props.role;

    return userEntity;
  }

  static toEntity(userEntity: User): UserEntity {
    if (!userEntity) return null;

    return {
      id: userEntity.id,
      role: userEntity.role,
      email: userEntity.email,
      username: userEntity.username,
      firstName: userEntity.first_name,
      lastName: userEntity.last_name,
      password: userEntity.password,
      createdAt: userEntity.created_at,
      updatedAt: userEntity.updated_at,
      deletedAt: userEntity.deleted_at,
    };
  }
}
