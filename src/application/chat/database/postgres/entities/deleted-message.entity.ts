import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '@chat/database/postgres/entities/message.entity';

@Entity({
  schema: 'chat',
  name: 'deleted_messages',
  comment: 'messages that are deleted for users',
})
export class DeletedMessage {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  user_id: string;

  @Column({ type: 'bigint' })
  message_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Message, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}
