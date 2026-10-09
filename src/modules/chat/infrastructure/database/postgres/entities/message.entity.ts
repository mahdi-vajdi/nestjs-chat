import {
  Column,
  CreateDateColumn,
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
  @Index('messages_conversation_id_idx')
  conversation_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  edited_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  @Index('messages_reply_to_message_id_idx')
  reply_to_message_id: string | null;

  @ManyToOne(() => Message, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({
    name: 'reply_to_message_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'messages_reply_to_message_id_fk',
  })
  reply_to_message?: Message | null;

  @ManyToOne(() => Conversation, (c) => c.messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'conversation_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'messages_conversation_id_fk',
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
    message.edited_at = entity.editedAt ?? null;
    message.reply_to_message_id = entity.replyToMessageId ?? null;

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
      message.edited_at,
      message.reply_to_message_id,
    );

    if (message.sender) {
      entity.loadSender(ConversationMember.toDomain(message.sender));
    }

    if (message.conversation) {
      entity.loadConversation(Conversation.toDomain(message.conversation));
    }

    if (message.reply_to_message) {
      entity.loadReplyToMessage(Message.toDomain(message.reply_to_message));
    }

    return entity;
  }
}
