import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationType } from '@chat/enums/conversation-type.enum';
import { MessageEntity } from '@chat/database/postgres/entities/message.entity';
import { Conversation } from '@chat/models/conversation.entity';

@Entity({ name: 'conversations' })
export class ConversationEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @Column({ type: 'varchar', nullable: true })
  picture?: string;

  @Column({ type: 'varchar', nullable: true })
  identifier?: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.PRIVATE,
  })
  type: ConversationType;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @OneToMany(() => MessageEntity, (m) => m.conversation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  messages: MessageEntity[];

  static fromDomain(conversation: Conversation): ConversationEntity {
    if (!conversation) return null;

    const conversationEntity = new ConversationEntity();

    conversationEntity.title = conversation.title;
    conversationEntity.picture = conversation.picture;
    conversationEntity.identifier = conversation.identifier;
    conversationEntity.type = conversation.type;

    return conversationEntity;
  }

  static toDomain(conversationEntity: ConversationEntity): Conversation {
    if (!conversationEntity) return null;

    return {
      id: conversationEntity.id,
      title: conversationEntity.title,
      picture: conversationEntity.picture,
      identifier: conversationEntity.identifier,
      type: conversationEntity.type,
      messages: conversationEntity.messages
        ? conversationEntity.messages.map((m) => MessageEntity.toDomain(m))
        : [],
      createdAt: conversationEntity.createdAt,
      updatedAt: conversationEntity.updatedAt,
      deletedAt: conversationEntity.deletedAt,
    };
  }
}
