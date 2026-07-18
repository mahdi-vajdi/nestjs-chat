import { MessageType } from '@chat/domain/enums/chat-type.enum';
import { SoftDeletableEntity } from '@common/entities/soft-deletable-entity.interface';
import { ConversationEntity } from '@chat/domain/models/conversation.model';
import { ConversationMemberEntity } from '@chat/domain/models/conversation-member.model';
import { v7 as uuidv7 } from 'uuid';

import { AggregateRoot } from '@common/domain/aggregate-root';
import { MessageCreatedDomainEvent } from '@chat/domain/events/message-created.domain-event';

export class MessageEntity
  extends AggregateRoot<string>
  implements SoftDeletableEntity
{
  private _text: string;
  private _type: MessageType;
  private _senderId: string;
  private _conversationId: string;
  private _deletedForUserIds: string[];
  private _deletedAt?: Date;

  // Transient properties
  public sender?: Partial<ConversationMemberEntity>;
  public conversation?: Partial<ConversationEntity>;

  private constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    text: string,
    type: MessageType,
    senderId: string,
    conversationId: string,
    deletedForUserIds: string[] = [],
    deletedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._text = text;
    this._type = type;
    this._senderId = senderId;
    this._conversationId = conversationId;
    this._deletedForUserIds = deletedForUserIds;
    this._deletedAt = deletedAt;
  }

  public static create(
    text: string,
    type: MessageType,
    senderId: string,
    conversationId: string,
    deletedForUserIds: string[] = [],
  ): MessageEntity {
    const id = uuidv7();
    const createdAt = new Date();
    const message = new MessageEntity(
      id,
      createdAt,
      createdAt,
      text,
      type,
      senderId,
      conversationId,
      deletedForUserIds,
    );

    message.apply(
      new MessageCreatedDomainEvent(
        id,
        conversationId,
        senderId,
        text,
        deletedForUserIds,
        createdAt,
      ),
    );

    return message;
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
    return new MessageEntity(
      id,
      createdAt,
      updatedAt,
      text,
      type,
      senderId,
      conversationId,
      deletedForUserIds,
      deletedAt,
    );
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
  public get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  public deleteForUser(userId: string): void {
    if (!this._deletedForUserIds.includes(userId)) {
      this._deletedForUserIds.push(userId);
      this.updatedAt = new Date();
    }
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
