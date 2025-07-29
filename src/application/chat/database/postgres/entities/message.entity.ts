import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatType } from '@chat/enums/chat-type.enum';
import { ConversationEntity } from '@chat/database/postgres/entities/conversation.entity';
import { Message } from '@chat/models/message.entity';

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
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @ManyToOne(() => ConversationEntity, (c) => c.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  conversation: ConversationEntity;

  static fromDomain(message: Message): MessageEntity {
    if (!message) return null;

    const messageEntity = new MessageEntity();

    messageEntity.text = message.text;
    messageEntity.type = message.type;
    messageEntity.senderId = message.senderId;
    messageEntity.conversationId = message.conversation.id;

    return messageEntity;
  }

  static toDomain(messageEntity: MessageEntity): Message {
    if (!messageEntity) return null;

    return {
      id: messageEntity.id,
      text: messageEntity.text,
      type: messageEntity.type,
      senderId: messageEntity.senderId,
      conversation: messageEntity.conversation
        ? ConversationEntity.toDomain(messageEntity.conversation)
        : {
            id: messageEntity.conversationId,
          },
      createdAt: messageEntity.createdAt,
      updatedAt: messageEntity.updatedAt,
      deletedAt: messageEntity.deletedAt,
    };
  }
}
