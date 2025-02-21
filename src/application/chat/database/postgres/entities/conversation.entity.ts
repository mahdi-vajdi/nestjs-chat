import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationType } from '@application/chat/enums/conversation-type.enum';
import { MessageEntity } from '@application/chat/database/postgres/entities/message.entity';

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
  updateAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  @OneToMany(() => MessageEntity, (m) => m.conversation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  messages: MessageEntity[];
}
