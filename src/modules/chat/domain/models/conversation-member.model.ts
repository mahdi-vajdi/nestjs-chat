import { IdentifiableEntity } from '@common/entities/identifiable-entity.interface';
import { TimestampedEntity } from '@common/entities/timestamped-entity.interface';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { MessageEntity } from '@chat/domain/models/message.entity';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { v7 as uuidv7 } from 'uuid';

export class ConversationMemberEntity
  implements IdentifiableEntity, TimestampedEntity, SoftDeletableEntity
{
  private _id: string;
  private _userId: string;
  private _conversationId: string;
  private _lastSeenMessageId?: string;
  private _lastMessageId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date;

  // Transient properties
  public conversation?: Partial<ConversationEntity>;
  public lastSeenMessage?: Partial<MessageEntity>;
  public lastMessage?: Partial<MessageEntity>;
  public notSeenCount?: number;

  private constructor(
    id: string,
    userId: string,
    conversationId: string,
    lastSeenMessageId?: string,
    lastMessageId?: string,
  ) {
    this._id = id;
    this._userId = userId;
    this._conversationId = conversationId;
    this._lastSeenMessageId = lastSeenMessageId;
    this._lastMessageId = lastMessageId;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  public static create(
    userId: string,
    conversationId: string,
  ): ConversationMemberEntity {
    return new ConversationMemberEntity(uuidv7(), userId, conversationId);
  }

  public static reconstruct(
    id: string,
    userId: string,
    conversationId: string,
    lastSeenMessageId: string | undefined,
    lastMessageId: string | undefined,
    createdAt: Date,
    updatedAt: Date,
    deletedAt?: Date,
  ): ConversationMemberEntity {
    const member = new ConversationMemberEntity(
      id,
      userId,
      conversationId,
      lastSeenMessageId,
      lastMessageId,
    );
    member._createdAt = createdAt;
    member._updatedAt = updatedAt;
    member._deletedAt = deletedAt;
    return member;
  }

  public get id(): string {
    return this._id;
  }
  public get userId(): string {
    return this._userId;
  }
  public get conversationId(): string {
    return this._conversationId;
  }
  public get lastSeenMessageId(): string | undefined {
    return this._lastSeenMessageId;
  }
  public get lastMessageId(): string | undefined {
    return this._lastMessageId;
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

  public updateLastSeenMessage(messageId: string): void {
    this._lastSeenMessageId = messageId;
    this._updatedAt = new Date();
  }

  public updateLastMessage(messageId: string): void {
    this._lastMessageId = messageId;
    this._updatedAt = new Date();
  }

  public softDelete(): void {
    this._deletedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = undefined;
  }
}
