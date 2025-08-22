import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageType } from '@chat/enums/chat-type.enum';
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';
import { MessageEntity, MessageProps } from '@chat/models/message.entity';
import { ConversationMember } from '@chat/database/postgres/entities/conversation-member.entity';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

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

  @ManyToOne(() => ConversationMember, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
  })
  @JoinColumn({
    name: 'sender_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'messages_sender_id_fk',
  })
  sender: ConversationMember;

  static fromProps(props: MessageProps): Message {
    if (!props) return null;

    const message = new Message();

    message.text = props.text;
    message.type = props.type;
    message.sender_id = props.sender.id;
    message.conversation_id = props.conversation.id;

    return message;
  }

  static toEntity(message: Message): MessageEntity {
    if (!message) return null;

    return {
      id: message.id,
      text: message.text,
      type: message.type,
      sender: message.sender
        ? ConversationMember.toEntity(message.sender)
        : {
            id: message.sender_id,
          },
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
