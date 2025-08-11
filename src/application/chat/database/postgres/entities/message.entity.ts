import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatType } from '@chat/enums/chat-type.enum';
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';
import { MessageEntity, MessageProps } from '@chat/models/message.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.TEXT })
  type: ChatType;

  @Column({ type: 'bigint' })
  @Index('messages_sender_id_idx')
  sender_id: string;

  @Column({ type: 'bigint' })
  conversation_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @ManyToOne(() => Conversation, (c) => c.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  conversation: Conversation;

  static fromProps(props: MessageProps): Message {
    if (!props) return null;

    const message = new Message();

    message.text = props.text;
    message.type = props.type;
    message.sender_id = props.senderId;
    message.conversation_id = props.conversation.id;

    return message;
  }

  static toEntity(message: Message): MessageEntity {
    if (!message) return null;

    return {
      id: message.id,
      text: message.text,
      type: message.type,
      senderId: message.sender_id,
      conversation: message.conversation
        ? Conversation.toEntity(message.conversation)
        : {
            id: message.conversation_id,
          },
      createdAt: message.created_at,
      updatedAt: message.updated_at,
      deletedAt: message.deleted_at,
    };
  }
}
