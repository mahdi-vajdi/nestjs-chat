import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';
import { Conversation } from '@modules/chat/infrastructure/database/postgres/entities/conversation.entity';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { ConversationMember } from '@modules/chat/infrastructure/database/postgres/entities/conversation-member.entity';

@Entity({ schema: 'chat', name: 'messages' })
export class Message {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'uuid' })
  @Index('messages_sender_id_idx')
  sender_id: string;

  @Column({ type: 'uuid' })
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

  static fromDomain(entity: MessageEntity): Message {
    if (!entity) return null;

    const message = new Message();
    message.id = entity.id;
    message.text = entity.text;
    message.type = entity.type;
    message.sender_id = entity.senderId;
    message.conversation_id = entity.conversationId;
    message.created_at = entity.createdAt;
    message.updated_at = entity.updatedAt;
    message.deleted_at = entity.deletedAt;

    return message;
  }

  static toDomain(message: Message): MessageEntity {
    if (!message) return null;

    const entity = MessageEntity.reconstruct(
      message.id,
      message.text,
      message.type,
      message.sender_id,
      message.conversation_id,
      [], // deletedForUserIds must be populated separately by the repo
      message.created_at,
      message.updated_at,
      message.deleted_at,
    );

    if (message.sender) {
      entity.loadSender(ConversationMember.toDomain(message.sender));
    }

    if (message.conversation) {
      entity.loadConversation(Conversation.toDomain(message.conversation));
    }

    return entity;
  }
}
