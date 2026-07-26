import { MessageEntity } from '@modules/chat/domain/models/message.entity';
import { ConversationType } from '@modules/chat/domain/enums/conversation-type.enum';
import { ConversationMemberEntity } from '@modules/chat/domain/models/conversation-member.model';
import { v7 as uuidv7 } from 'uuid';

import { AggregateRoot } from '@common/domain/aggregate-root';

export class ConversationEntity extends AggregateRoot<string> {
  private readonly _title: string | null;
  private readonly _picture: string | null;
  private readonly _identifier: string | null;
  private readonly _type: ConversationType;
  private _deletedAt?: Date;

  // Domain associations
  private _members: ConversationMemberEntity[] = [];
  private _messages: MessageEntity[] = [];
  private _lastMessage?: MessageEntity;

  public get members() {
    return [...this._members];
  }
  public get messages() {
    return [...this._messages];
  }
  public get lastMessage() {
    return this._lastMessage;
  }

  // Domain Behaviors
  public addMember(member: ConversationMemberEntity): void {
    if (this._type === ConversationType.DIRECT && this._members.length >= 2) {
      throw new Error('Direct conversations can only have 2 members');
    }
    if (!this._members.some((m) => m.userId === member.userId)) {
      this._members.push(member);
      this.updatedAt = new Date();
    }
  }

  public addMessage(message: MessageEntity): void {
    this._messages.push(message);
    this._lastMessage = message;
    this.updatedAt = new Date();
  }

  // Infrastructure Loaders (For Mappers Only)
  public loadMembers(members: ConversationMemberEntity[]): void {
    this._members = members;
  }
  public loadMessages(messages: MessageEntity[]): void {
    this._messages = messages;
  }
  public loadLastMessage(message: MessageEntity): void {
    this._lastMessage = message;
  }

  private constructor(
    id: string,
    createdAt: Date,
    updatedAt: Date,
    type: ConversationType,
    title: string | null = null,
    picture: string | null = null,
    identifier: string | null = null,
    deletedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._type = type;
    this._title = title;
    this._picture = picture;
    this._identifier = identifier;
    this._deletedAt = deletedAt;
  }

  public static createDirect(
    userId: string,
    targetUserId: string,
  ): ConversationEntity {
    const id = uuidv7();
    const conversation = new ConversationEntity(
      id,
      new Date(),
      new Date(),
      ConversationType.DIRECT,
      null,
      null,
      uuidv7(),
    );

    conversation.addMember(ConversationMemberEntity.create(userId, id));
    conversation.addMember(ConversationMemberEntity.create(targetUserId, id));

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
    return new ConversationEntity(
      id,
      createdAt,
      updatedAt,
      type,
      title,
      picture,
      identifier,
      deletedAt,
    );
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
    this.updatedAt = new Date();
  }

  public restore(): void {
    this._deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
