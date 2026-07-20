import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationType } from '@chat/domain/enums/conversation-type.enum';
import { Message } from '@chat/infrastructure/database/entities/message.entity';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ConversationMember } from '@chat/infrastructure/database/entities/conversation-member.entity';

@Entity({ schema: 'chat', name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ type: 'varchar', nullable: true })
  picture: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index('conversations_identifier_uniq', { unique: true })
  identifier: string | null;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @OneToMany(() => Message, (m) => m.conversation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  messages: Message[];

  @OneToMany(() => ConversationMember, (cm) => cm.conversation)
  conversationMembers: ConversationMember[];

  static fromDomain(entity: ConversationEntity): Conversation {
    if (!entity) return null;

    const conversation = new Conversation();
    conversation.id = entity.id;
    conversation.title = entity.title;
    conversation.picture = entity.picture;
    conversation.identifier = entity.identifier;
    conversation.type = entity.type;
    conversation.created_at = entity.createdAt;
    conversation.updated_at = entity.updatedAt;
    conversation.deleted_at = entity.deletedAt;

    if (entity.messages && entity.messages.length > 0) {
      conversation.messages = entity.messages.map((m) => Message.fromDomain(m));
    }

    if (entity.members && entity.members.length > 0) {
      conversation.conversationMembers = entity.members.map((cm) =>
        ConversationMember.fromDomain(cm),
      );
    }

    return conversation;
  }

  static toDomain(conversation: Conversation): ConversationEntity {
    if (!conversation) return null;

    const entity = ConversationEntity.reconstruct(
      conversation.id,
      conversation.type,
      conversation.title,
      conversation.picture,
      conversation.identifier,
      conversation.created_at,
      conversation.updated_at,
      conversation.deleted_at,
    );

    if (conversation.messages) {
      entity.messages = conversation.messages.map((m) => Message.toDomain(m));
    }

    if (conversation.conversationMembers) {
      entity.members = conversation.conversationMembers.map((cm) =>
        ConversationMember.toDomain(cm),
      );
    }

    return entity;
  }
}
