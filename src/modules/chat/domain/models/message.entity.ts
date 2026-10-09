import { MessageType } from '@modules/chat/domain/enums/chat-type.enum';
import { ConversationEntity } from '@modules/chat/domain/models/conversation.model';
import { ConversationMemberEntity } from '@modules/chat/domain/models/conversation-member.model';
import { v7 as uuidv7 } from 'uuid';

import { AggregateRoot } from '@common/domain/aggregate-root';
import { MessageCreatedDomainEvent } from '@modules/chat/domain/events/message-created.domain-event';
import { MessageEditedDomainEvent } from '@modules/chat/domain/events/message-edited.domain-event';
import { MessageDeletedDomainEvent } from '@modules/chat/domain/events/message-deleted.domain-event';
import { MessageDeleteScope } from '@modules/chat/domain/enums/message-delete-scope.enum';
import {
  ChatDomainError,
  MessageNotFoundException,
  NotMessageOwnerException,
} from '@modules/chat/domain/chat.exceptions';

export class MessageEntity extends AggregateRoot<string> {
  private _text: string;
  private readonly _type: MessageType;
  private readonly _senderId: string;
  private readonly _conversationId: string;
  private readonly _deletedForUserIds: string[];
  private readonly _replyToMessageId?: string | null;
  private _deletedAt?: Date;
  private _editedAt?: Date;

  // Transient properties
  private _sender?: Partial<ConversationMemberEntity>;
  private _conversation?: Partial<ConversationEntity>;
  private _replyToMessage?: Partial<MessageEntity> | null;

  public get sender() {
    return this._sender;
  }
  public get conversation() {
    return this._conversation;
  }
  public get replyToMessage() {
    return this._replyToMessage;
  }

  public loadSender(sender: Partial<ConversationMemberEntity>) {
    this._sender = sender;
  }
  public loadConversation(c: Partial<ConversationEntity>) {
    this._conversation = c;
  }
  public loadReplyToMessage(msg: Partial<MessageEntity> | null) {
    this._replyToMessage = msg;
  }

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
    editedAt?: Date,
    replyToMessageId?: string | null,
  ) {
    super(id, createdAt, updatedAt);
    this._text = text;
    this._type = type;
    this._senderId = senderId;
    this._conversationId = conversationId;
    this._deletedForUserIds = deletedForUserIds;
    this._deletedAt = deletedAt;
    this._editedAt = editedAt;
    this._replyToMessageId = replyToMessageId ?? null;
  }

  public static create(
    text: string,
    type: MessageType,
    senderId: string,
    conversationId: string,
    deletedForUserIds: string[] = [],
    replyToMessageId?: string | null,
  ): MessageEntity {
    const id = uuidv7();
    if (replyToMessageId && replyToMessageId === id) {
      throw new ChatDomainError('A message cannot reply to itself');
    }
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
      undefined,
      undefined,
      replyToMessageId,
    );

    message.apply(
      new MessageCreatedDomainEvent(
        id,
        conversationId,
        senderId,
        text,
        deletedForUserIds,
        createdAt,
        replyToMessageId,
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
    editedAt?: Date,
    replyToMessageId?: string | null,
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
      editedAt,
      replyToMessageId,
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
  public get replyToMessageId(): string | null | undefined {
    return this._replyToMessageId;
  }
  public get deletedForUserIds(): string[] {
    return [...this._deletedForUserIds];
  }
  public get deletedAt(): Date | undefined {
    return this._deletedAt;
  }
  public get editedAt(): Date | undefined {
    return this._editedAt;
  }

  public edit(newText: string, editorMemberId: string): void {
    if (this._deletedAt) {
      throw new MessageNotFoundException('Cannot edit a deleted message');
    }

    if (editorMemberId !== this._senderId) {
      throw new NotMessageOwnerException();
    }

    if (this._type !== MessageType.TEXT) {
      throw new ChatDomainError('Only text messages can be edited');
    }

    const trimmedText = newText ? newText.trim() : '';
    if (!trimmedText) {
      throw new ChatDomainError('Message text cannot be empty');
    }

    if (this._text === newText) {
      return;
    }

    this._text = newText;
    const now = new Date();
    this._editedAt = now;
    this.updatedAt = now;

    this.apply(
      new MessageEditedDomainEvent(
        this.id,
        this._conversationId,
        this._senderId,
        this._text,
        this._deletedForUserIds,
        this._editedAt,
      ),
    );
  }

  public deleteForUser(userId: string): void {
    if (this._deletedForUserIds.includes(userId)) {
      return;
    }

    this._deletedForUserIds.push(userId);
    this.updatedAt = new Date();

    this.apply(
      new MessageDeletedDomainEvent(
        this.id,
        this._conversationId,
        MessageDeleteScope.ME,
        userId,
        this._deletedForUserIds,
        this._deletedAt,
      ),
    );
  }

  public deleteForEveryone(
    requesterMemberId: string,
    actorUserId: string,
  ): void {
    if (requesterMemberId !== this._senderId) {
      throw new NotMessageOwnerException();
    }

    if (this._deletedAt) {
      return;
    }

    const now = new Date();
    this._deletedAt = now;
    this.updatedAt = now;

    this.apply(
      new MessageDeletedDomainEvent(
        this.id,
        this._conversationId,
        MessageDeleteScope.EVERYONE,
        actorUserId,
        this._deletedForUserIds,
        this._deletedAt,
      ),
    );
  }

  public loadDeletedForUserId(userId: string): void {
    if (!this._deletedForUserIds.includes(userId)) {
      this._deletedForUserIds.push(userId);
    }
  }

  public loadDeletedForUserIds(userIds: string[]): void {
    for (const userId of userIds) {
      this.loadDeletedForUserId(userId);
    }
  }
}
