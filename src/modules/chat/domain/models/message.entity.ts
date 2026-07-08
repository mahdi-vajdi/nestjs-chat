import { MessageType } from '@chat/domain/enums/chat-type.enum';
import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';

export interface MessageProps {
  text: string;
  type: MessageType;
  sender: Partial<ConversationMemberEntity>;
  conversation: Partial<ConversationEntity>;
  deletedForUserIds?: string[];
}

export interface MessageEntity
  extends
    MessageProps,
    IdentifiableEntity,
    TimestampedEntity,
    SoftDeletableEntity {}
