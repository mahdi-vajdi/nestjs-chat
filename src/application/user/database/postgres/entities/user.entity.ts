import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@user/enums/user-role.enum';
import { UserEntity, UserProps } from '@user/models/user.model';
import { UserBlock } from '@user/database/postgres/entities/user-block.entity';

@Entity({ schema: 'user', name: 'users' })
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
  first_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  last_name: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date | null;

  @OneToMany(() => UserBlock, (ub) => ub.blocked)
  blockedUsers: UserBlock[];

  @OneToMany(() => UserBlock, (ub) => ub.blocker)
  blockerUsers: UserBlock[];

  static fromProps(props: UserProps): User {
    if (!props) return null;

    const user = new User();

    user.email = props.email;
    user.username = props.username;
    user.password = props.password;
    user.first_name = props.firstName;
    user.last_name = props.lastName;
    user.role = props.role;
    user.avatar = props.avatar;

    return user;
  }

  static toEntity(user: User): UserEntity {
    if (!user) return null;

    return {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      avatar: user.avatar,
      password: user.password,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      deletedAt: user.deleted_at,
      blockedUsers: [],
    };
  }
}
