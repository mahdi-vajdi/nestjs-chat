import { Entity } from '@common/domain/entity';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';
import { v7 as uuidv7 } from 'uuid';

export class ConversationMemberEntity
  extends Entity<string>
  implements SoftDeletableEntity
{
  private readonly _userId: string;
  private readonly _conversationId: string;
  private _lastSeenMessageId?: string;
  private _lastMessageId?: string;
  private _deletedAt?: Date;

  // Transient properties
  public conversation?: Partial<ConversationEntity>;
  public lastSeenMessage?: Partial<MessageEntity>;
  public lastMessage?: Partial<MessageEntity>;
  public notSeenCount?: number;

  private constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    userId: string,
    conversationId: string,
    lastSeenMessageId?: string,
    lastMessageId?: string,
    deletedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._userId = userId;
    this._conversationId = conversationId;
    this._lastSeenMessageId = lastSeenMessageId;
    this._lastMessageId = lastMessageId;
    this._deletedAt = deletedAt;
  }

  public static create(
    userId: string,
    conversationId: string,
  ): ConversationMemberEntity {
    return new ConversationMemberEntity(
      uuidv7(),
      new Date(),
      new Date(),
      userId,
      conversationId,
    );
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
    return new ConversationMemberEntity(
      id,
      createdAt,
      updatedAt,
      userId,
      conversationId,
      lastSeenMessageId,
      lastMessageId,
      deletedAt,
    );
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
  public get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  public updateLastSeenMessage(messageId: string): void {
    this._lastSeenMessageId = messageId;
    this.updatedAt = new Date();
  }

  public updateLastMessage(messageId: string): void {
    this._lastMessageId = messageId;
    this.updatedAt = new Date();
  }

  public softDelete(): void {
    this._deletedAt = new Date();
    this.updatedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
