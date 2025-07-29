import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { Conversation } from '@chat/models/conversation.entity';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { ChatType } from '@chat/enums/chat-type.enum';

export class Message
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  text: string;
  type: ChatType;
  senderId: string;
  conversation: Partial<Conversation>;

  private constructor(properties: Partial<Message>) {
    Object.assign(this, properties);
  }

  static create(
    text: string,
    type: ChatType,
    senderId: string,
    conversation: Partial<Conversation>,
  ) {
    return new Message({
      text,
      type,
      senderId,
      conversation,
    });
  }
}
