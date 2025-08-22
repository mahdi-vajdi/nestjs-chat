import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { MessageEntity } from '@chat/models/message.entity';
import { ConversationType } from '@chat/enums/conversation-type.enum';
import { ConversationMemberEntity } from '@chat/models/conversation-member.model';

export interface ConversationProps {
  title: string;
  picture: string;
  identifier: string;
  type: ConversationType;
  messages: Partial<MessageEntity>[];
  members: Partial<ConversationMemberEntity>[];
}

export interface ConversationEntity
  extends ConversationProps,
    IdentifiableEntity,
    TimestampedEntity,
    SoftDeletableEntity {
  lastMessage?: Partial<MessageEntity>;
}
