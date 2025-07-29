import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { Message } from '@chat/models/message.entity';
import { ConversationType } from '@chat/enums/conversation-type.enum';

export class Conversation
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  title: string;
  picture: string;
  identifier: string;
  type: ConversationType;
  messages: Partial<Message>[];

  private constructor(properties: Partial<Conversation>) {
    Object.assign(this, properties);
  }

  static create(
    title: string,
    picture: string,
    identifier: string,
    type: ConversationType,
    messages?: Partial<Message>[],
  ) {
    return new Conversation({
      title,
      picture,
      identifier,
      type,
      messages,
    });
  }
}
