import { ChatType } from '@chat/enums/chat-type.enum';
import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { ConversationEntity } from '@chat/models/conversation.model';

export interface MessageProps {
  text: string;
  type: ChatType;
  senderId: string;
  conversation: Partial<ConversationEntity>;
}

export interface MessageEntity
  extends MessageProps,
    IdentifiableEntity,
    TimestampedEntity,
    SoftDeletableEntity {}
