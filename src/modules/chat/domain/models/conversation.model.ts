import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { MessageEntity } from '@chat/domain/models/message.entity';
import { ConversationType } from '@chat/domain/enums/conversation-type.enum';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';
import { AggregateRoot as CqrsAggregateRoot } from '@nestjs/cqrs';
import { v7 as uuidv7 } from 'uuid';

export class ConversationEntity
  extends CqrsAggregateRoot
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  private _id: string;
  private _title: string | null;
  private _picture: string | null;
  private _identifier: string | null;
  private _type: ConversationType;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date;

  // Domain associations
  public members: ConversationMemberEntity[] = [];
  public messages: MessageEntity[] = [];
  public lastMessage?: MessageEntity;

  private constructor(
    id: string,
    type: ConversationType,
    title: string | null = null,
    picture: string | null = null,
    identifier: string | null = null,
  ) {
    super();
    this._id = id;
    this._type = type;
    this._title = title;
    this._picture = picture;
    this._identifier = identifier;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  public static createDirect(
    userId: string,
    targetUserId: string,
  ): ConversationEntity {
    const id = uuidv7();
    const conversation = new ConversationEntity(
      id,
      ConversationType.DIRECT,
      null,
      null,
      uuidv7(),
    );

    conversation.members = [
      ConversationMemberEntity.create(userId, id),
      ConversationMemberEntity.create(targetUserId, id),
    ];

    // TODO: Apply ConversationCreatedEvent here

    return conversation;
  }

  public static reconstruct(
    id: string,
    type: ConversationType,
    title: string | null,
    picture: string | null,
    identifier: string | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt?: Date,
  ): ConversationEntity {
    const conversation = new ConversationEntity(
      id,
      type,
      title,
      picture,
      identifier,
    );
    conversation._createdAt = createdAt;
    conversation._updatedAt = updatedAt;
    conversation._deletedAt = deletedAt;
    return conversation;
  }

  public get id(): string {
    return this._id;
  }
  public get type(): ConversationType {
    return this._type;
  }
  public get title(): string | null {
    return this._title;
  }
  public get picture(): string | null {
    return this._picture;
  }
  public get identifier(): string | null {
    return this._identifier;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }
  public get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  public markAsRead(userId: string, messageId: string): void {
    const member = this.members.find((m) => m.userId === userId);
    if (member) {
      member.updateLastSeenMessage(messageId);
    }
  }

  public softDelete(): void {
    this._deletedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = undefined;
  }
}
