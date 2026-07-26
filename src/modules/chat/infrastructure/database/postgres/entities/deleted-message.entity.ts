import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Message } from '@modules/chat/infrastructure/database/postgres/entities/message.entity';

@Entity({
  schema: 'chat',
  name: 'deleted_messages',
  comment: 'messages that are deleted for users',
})
export class DeletedMessage {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @PrimaryColumn({ type: 'uuid' })
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
