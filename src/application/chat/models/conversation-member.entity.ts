import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { MessageEntity } from '@chat/models/message.entity';
import { ConversationEntity } from '@chat/models/conversation.model';

export interface ConversationMemberProps {
  userId: string;
  conversation: Partial<ConversationEntity>;
  lastSeenMessage: Partial<MessageEntity>;
  lastMessage: Partial<MessageEntity>;
}

export interface ConversationMemberEntity
  extends ConversationMemberProps,
    IdentifiableEntity,
    TimestampedEntity,
    SoftDeletableEntity {}
