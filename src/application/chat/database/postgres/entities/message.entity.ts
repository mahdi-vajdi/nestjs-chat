import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatType } from '@application/chat/enums/chat-type.enum';
import { ConversationEntity } from '@application/chat/database/postgres/entities/conversation.entity';

@Entity({ name: 'messages' })
export class MessageEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.TEXT })
  type: ChatType;

  @Column({ type: 'bigint' })
  senderId: string;

  @Column({ type: 'bigint' })
  conversationId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updateAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @ManyToOne(() => ConversationEntity, (c) => c.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  conversation: ConversationEntity;
}
