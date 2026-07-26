import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@modules/user/domain/enums/user-role.enum';
import { UserEntity } from '@modules/user/domain/models/user.model';
import { UserBlock } from '@modules/user/infrastructure/database/postgres/entities/user-block.entity';

@Entity({ schema: 'user', name: 'users' })
export class User {
  @PrimaryColumn('uuid')
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

  // The users I have blocked (I am the blocker)
  @OneToMany(() => UserBlock, (ub) => ub.blocker, { cascade: true })
  blockedUsers: UserBlock[];

  // The users who have blocked me (I am the blocked)
  @OneToMany(() => UserBlock, (ub) => ub.blocked)
  blockerUsers: UserBlock[];

  static toOrm(userEntity: UserEntity): User {
    if (!userEntity) return null;

    const user = new User();

    // TypeORM handles bigints as strings, if it's undefined (new entity), we leave it
    if (userEntity.id) {
      user.id = userEntity.id;
    }

    user.email = userEntity.email;
    user.username = userEntity.username;
    user.password = userEntity.password;
    user.first_name = userEntity.firstName;
    user.last_name = userEntity.lastName;
    user.role = userEntity.role;
    user.avatar = userEntity.avatar;
    user.created_at = userEntity.createdAt;
    user.updated_at = userEntity.updatedAt;
    user.deleted_at = userEntity.deletedAt;

    if (userEntity.blockedUsers && userEntity.blockedUsers.length > 0) {
      user.blockedUsers = userEntity.blockedUsers.map((blockedUser) => {
        const ub = new UserBlock();
        ub.blocker_id = userEntity.id;
        ub.blocked_id = blockedUser.id!;
        return ub;
      });
    } else {
      user.blockedUsers = [];
    }

    return user;
  }

  static toEntity(user: User): UserEntity {
    if (!user) return null;

    return new UserEntity(
      user.id,
      user.created_at,
      user.updated_at,
      user.email,
      user.username,
      user.password,
      user.first_name,
      user.last_name,
      user.role,
      user.avatar,
      [], // blockedUsers
      user.deleted_at,
    );
  }
}
