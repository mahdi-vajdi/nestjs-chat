import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@user/infrastructure/postgres/entities/user.entity';

@Entity({ schema: 'user', name: 'user_blocks' })
export class UserBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  blocker_id: string;

  @Column({ type: 'uuid' })
  blocked_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date | null;

  @ManyToOne(() => User, (u) => u.blockerUsers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @ManyToOne(() => User, (u) => u.blockedUsers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;
}
