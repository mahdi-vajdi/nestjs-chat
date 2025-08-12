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
import { ConversationType } from '@chat/enums/conversation-type.enum';
import { Message } from '@chat/database/postgres/entities/message.entity';
import {
  ConversationEntity,
  ConversationProps,
} from '@chat/models/conversation.model';
import { ConversationMember } from '@chat/database/postgres/entities/conversation-member.entity';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
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
    default: ConversationType.PRIVATE,
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

  static fromProps(props: ConversationProps): Conversation {
    if (!props) return null;

    const conversation = new Conversation();

    conversation.title = props.title;
    conversation.picture = props.picture;
    conversation.identifier = props.identifier;
    conversation.type = props.type;

    return conversation;
  }

  static toEntity(conversation: Conversation): ConversationEntity {
    if (!conversation) return null;

    return {
      id: conversation.id,
      title: conversation.title,
      picture: conversation.picture,
      identifier: conversation.identifier,
      type: conversation.type,
      messages: conversation.messages
        ? conversation.messages.map((m) => Message.toEntity(m))
        : [],
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      deletedAt: conversation.deleted_at,
    };
  }
}
