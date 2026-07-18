import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '@chat/infrastructure/postgres/entities/message.entity';

@Entity({
  schema: 'chat',
  name: 'deleted_messages',
  comment: 'messages that are deleted for users',
})
export class DeletedMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
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
