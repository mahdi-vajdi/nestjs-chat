import { MessageType } from '@chat/domain/enums/chat-type.enum';
import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';
import { v7 as uuidv7 } from 'uuid';

export class MessageEntity
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  private _id: string;
  private _text: string;
  private _type: MessageType;
  private _senderId: string;
  private _conversationId: string;
  private _deletedForUserIds: string[];
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date;

  // Transient properties
  public sender?: Partial<ConversationMemberEntity>;
  public conversation?: Partial<ConversationEntity>;

  private constructor(
    id: string,
    text: string,
    type: MessageType,
    senderId: string,
    conversationId: string,
    deletedForUserIds: string[] = [],
  ) {
    this._id = id;
    this._text = text;
    this._type = type;
    this._senderId = senderId;
    this._conversationId = conversationId;
    this._deletedForUserIds = deletedForUserIds;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  public static create(
    text: string,
    type: MessageType,
    senderId: string,
    conversationId: string,
    deletedForUserIds: string[] = [],
  ): MessageEntity {
    return new MessageEntity(
      uuidv7(),
      text,
      type,
      senderId,
      conversationId,
      deletedForUserIds,
    );
  }

  public static reconstruct(
    id: string,
    text: string,
    type: MessageType,
    senderId: string,
    conversationId: string,
    deletedForUserIds: string[],
    createdAt: Date,
    updatedAt: Date,
    deletedAt?: Date,
  ): MessageEntity {
    const message = new MessageEntity(
      id,
      text,
      type,
      senderId,
      conversationId,
      deletedForUserIds,
    );
    message._createdAt = createdAt;
    message._updatedAt = updatedAt;
    message._deletedAt = deletedAt;
    return message;
  }

  public get id(): string {
    return this._id;
  }
  public get text(): string {
    return this._text;
  }
  public get type(): MessageType {
    return this._type;
  }
  public get senderId(): string {
    return this._senderId;
  }
  public get conversationId(): string {
    return this._conversationId;
  }
  public get deletedForUserIds(): string[] {
    return [...this._deletedForUserIds];
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

  public deleteForUser(userId: string): void {
    if (!this._deletedForUserIds.includes(userId)) {
      this._deletedForUserIds.push(userId);
      this._updatedAt = new Date();
    }
  }

  public softDelete(): void {
    this._deletedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = undefined;
  }
}
