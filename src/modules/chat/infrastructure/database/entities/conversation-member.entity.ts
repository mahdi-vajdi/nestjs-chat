import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from '@chat/infrastructure/database/entities/conversation.entity';
import { Message } from '@chat/infrastructure/database/entities/message.entity';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';

@Entity({ schema: 'chat', name: 'conversation_members' })
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  conversation_id: string;

  @Column({ type: 'uuid', nullable: true })
  last_seen_message_id: string;

  @Column({ type: 'uuid', nullable: true })
  last_message_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @ManyToOne(() => Conversation, (c) => c.conversationMembers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id', referencedColumnName: 'id' })
  conversation: Conversation;

  @OneToOne(() => Message, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'last_seen_message_id', referencedColumnName: 'id' })
  lastSeenMessage: Message;

  @OneToOne(() => Message, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'last_message', referencedColumnName: 'id' })
  lastMessage: Message;

  static fromDomain(entity: ConversationMemberEntity): ConversationMember {
    if (!entity) return null;

    const conversationMember = new ConversationMember();
    conversationMember.id = entity.id;
    conversationMember.user_id = entity.userId;
    conversationMember.conversation_id = entity.conversationId;
    conversationMember.last_seen_message_id = entity.lastSeenMessageId;
    conversationMember.last_message_id = entity.lastMessageId;
    conversationMember.created_at = entity.createdAt;
    conversationMember.updated_at = entity.updatedAt;
    conversationMember.deleted_at = entity.deletedAt;

    return conversationMember;
  }

  static toDomain(
    conversationMember: ConversationMember,
  ): ConversationMemberEntity {
    if (!conversationMember) return null;

    const entity = ConversationMemberEntity.reconstruct(
      conversationMember.id,
      conversationMember.user_id,
      conversationMember.conversation_id,
      conversationMember.last_seen_message_id,
      conversationMember.last_message_id,
      conversationMember.created_at,
      conversationMember.updated_at,
      conversationMember.deleted_at,
    );

    if (conversationMember.conversation) {
      entity.conversation = Conversation.toDomain(
        conversationMember.conversation,
      );
    }
    if (conversationMember.lastSeenMessage) {
      entity.lastSeenMessage = Message.toDomain(
        conversationMember.lastSeenMessage,
      );
    }
    if (conversationMember.lastMessage) {
      entity.lastMessage = Message.toDomain(conversationMember.lastMessage);
    }

    return entity;
  }
}
