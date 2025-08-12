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
import { Conversation } from '@chat/database/postgres/entities/conversation.entity';
import { Message } from '@chat/database/postgres/entities/message.entity';
import {
  ConversationMemberEntity,
  ConversationMemberProps,
} from '@chat/models/conversation-member.entity';

@Entity()
export class ConversationMember {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  user_id: string;

  @Column({ type: 'bigint' })
  conversation_id: string;

  @Column({ type: 'bigint', nullable: true })
  last_seen_message_id: string;

  @Column({ type: 'bigint', nullable: true })
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
  @JoinColumn({ name: 'last_seen_message_id', referencedColumnName: 'id' })
  lastMessage: Message;

  static fromProps(props: ConversationMemberProps): ConversationMember {
    if (!props) return null;

    const conversationMember = new ConversationMember();

    conversationMember.user_id = props.userId;
    conversationMember.conversation_id = props.conversation.id;
    conversationMember.last_seen_message_id = props.lastSeenMessage.id;
    conversationMember.last_message_id = props.lastMessage.id;

    return conversationMember;
  }

  static toEntity(
    conversationMember: ConversationMember,
  ): ConversationMemberEntity {
    if (!conversationMember) return null;

    return {
      id: conversationMember.id,
      userId: conversationMember.user_id,
      conversation: conversationMember.conversation
        ? Conversation.toEntity(conversationMember.conversation)
        : {
            id: conversationMember.conversation_id,
          },
      lastSeenMessage: conversationMember.lastSeenMessage
        ? Message.toEntity(conversationMember.lastSeenMessage)
        : conversationMember.last_seen_message_id
          ? {
              id: conversationMember.last_seen_message_id,
            }
          : null,
      lastMessage: conversationMember.lastMessage
        ? Message.toEntity(conversationMember.lastMessage)
        : conversationMember.last_message_id
          ? {
              id: conversationMember.last_message_id,
            }
          : null,
      createdAt: conversationMember.created_at,
      updatedAt: conversationMember.updated_at,
      deletedAt: conversationMember.deleted_at,
    };
  }
}
